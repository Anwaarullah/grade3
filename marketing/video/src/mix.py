"""Mix the voice-over over the backing music, with the music ducked under the voice.

usage: python3 mix.py PLAN.json MUSIC.wav OUT.wav SECONDS     (needs numpy)

* Each cue wav from PLAN.json ("cues": [{at, file, ...}]) is placed at its 'at' time.
* SPLITS stretches a pause inside a cue (s14: "Just fifteen minutes a day." stays on the
  15-minutes scene, "Try it tonight! Made by ..." moves to the end card, which starts at 64.3 s).
* Music: ~20 dB below the voice while she speaks, back up to a soft bed in the gaps
  (smooth side-chain envelope: 60 ms attack, 450 ms release, look-ahead so it dips before the word).
* Writes 48 kHz stereo float WAV; final loudness (-16 LUFS, -1 dBTP) is set by ffmpeg loudnorm in build.sh.
"""
import json, os, sys, wave
import numpy as np

SR = 48000
plan_path, music_path, out_path, DUR = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
VO_DIR = os.path.dirname(os.path.abspath(plan_path))
# cue file -> [(split point in the wav, seconds of extra silence inserted there)]
SPLITS = {"s14.wav": [(1.90, 1.20)]}
DUCK_DB = -20.0     # music level re. voice while speaking (RMS)
BED_DB = -9.0       # music level re. voice in the gaps between lines


def read_wav(path):
    with wave.open(path, "rb") as w:
        assert w.getframerate() == SR, (path, w.getframerate())
        ch, sw, n = w.getnchannels(), w.getsampwidth(), w.getnframes()
        raw = w.readframes(n)
    if sw == 2:
        x = np.frombuffer(raw, "<i2").astype(np.float64) / 32768.0
    elif sw == 4:
        x = np.frombuffer(raw, "<i4").astype(np.float64) / 2147483648.0
    else:
        raise SystemExit(f"{path}: unsupported sample width {sw}")
    return x.reshape(-1, ch)


n = int(round(SR * DUR))
voice = np.zeros(n)
plan = json.load(open(plan_path))
for cue in plan["cues"]:
    x = read_wav(os.path.join(VO_DIR, cue["file"])).mean(axis=1)
    pieces, last, extra = [], 0, 0
    for at, gap in SPLITS.get(cue["file"], []):
        i = int(at * SR)
        pieces.append((last, i, extra)); last = i; extra += int(gap * SR)
    pieces.append((last, len(x), extra))
    for a, b, off in pieces:
        seg = x[a:b].copy()
        # 5 ms fades at the cut points so nothing clicks
        f = min(len(seg) // 2, int(0.005 * SR))
        if a > 0: seg[:f] *= np.linspace(0, 1, f)
        if b < len(x): seg[-f:] *= np.linspace(1, 0, f)
        i = int(round(cue["at"] * SR)) + a + off
        j = min(n, i + len(seg))
        voice[i:j] += seg[: j - i]

music = read_wav(music_path)
if len(music) < n:
    music = np.vstack([music, np.zeros((n - len(music), music.shape[1]))])
music = music[:n]

# levels: voice RMS over speech (20 ms windows above -45 dBFS), music RMS overall
win = int(0.02 * SR)
frames = voice[: len(voice) // win * win].reshape(-1, win)
rms = np.sqrt((frames ** 2).mean(axis=1))
v_rms = np.sqrt((rms[rms > 10 ** (-45 / 20)] ** 2).mean())
m_rms = np.sqrt((music ** 2).mean())

# side-chain envelope: 1 while speaking, 0 in gaps (hold short pauses), smoothed
act = np.repeat((rms > 10 ** (-45 / 20)).astype(float), win)
act = np.concatenate([act, np.zeros(n - len(act))])
hold = int(0.25 * SR)                                  # bridge breaths between words
idx = np.where(act > 0)[0]
held = np.zeros(n)
if len(idx):
    starts = np.concatenate([[idx[0]], idx[1:][np.diff(idx) > hold]])
    ends = np.concatenate([idx[:-1][np.diff(idx) > hold], [idx[-1]]])
    for a, b in zip(starts, ends):
        held[max(0, a - int(0.12 * SR)):b + 1] = 1.0      # 120 ms look-ahead
att, rel = np.exp(-1 / (0.06 * SR)), np.exp(-1 / (0.45 * SR))
env = np.empty(n); e = 0.0
for k in range(0, n, 64):                              # block-wise one-pole (fast enough)
    target = held[k]
    c = att if target > e else rel
    blk = min(64, n - k)
    env[k:k + blk] = target + (e - target) * c ** np.arange(1, blk + 1)
    e = env[k + blk - 1]

g_duck = v_rms * 10 ** (DUCK_DB / 20) / m_rms
g_bed = v_rms * 10 ** (BED_DB / 20) / m_rms
g = g_bed * (g_duck / g_bed) ** env                    # interpolate in dB
mix = music * g[:, None] + voice[:, None]
peak = np.abs(mix).max()
mix *= 0.5 / peak                                      # headroom; loudnorm sets the final level
pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
with wave.open(out_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"mix -> {out_path}: {DUR:.2f} s, voice speech RMS {20*np.log10(v_rms):.1f} dBFS, "
      f"music duck {20*np.log10(g_duck):+.1f} dB / bed {20*np.log10(g_bed):+.1f} dB")
