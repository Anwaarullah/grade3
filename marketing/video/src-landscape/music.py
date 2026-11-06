"""Gentle backing track for the promo video (no samples, pure synthesis).

Soft electric-piano style arpeggios over a warm pad and a quiet bass,
progression Fmaj7 - Dm7 - Bbmaj7 - C6 (two bars each) at 84 bpm,
light reverb, fade in and out.  Writes a 48 kHz stereo WAV.

usage: python3 music.py OUT.wav SECONDS     (needs numpy)
"""
import sys, wave
import numpy as np

SR = 48000
out_path = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 61.0
N = int(SR * (DUR + 3))  # a little tail for the reverb, trimmed later
BPM = 84.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12.0)


def add(buf, start, sig):
    i = int(start * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def epiano(f, dur, vel):
    """Soft bell-ish tone: sine + a little 2nd/3rd harmonic, fast-ish decay."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    env = np.exp(-t * 2.2) * (1 - np.exp(-t * 200))  # ~5 ms attack: no click
    rel = np.clip((dur - t) / 0.25, 0, 1)
    tone = (np.sin(2 * np.pi * f * t)
            + 0.18 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 4)
            + 0.05 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 7))
    return vel * tone * env * rel


def pad(freqs, dur):
    """Warm pad: detuned sines, slow attack/release, gentle tremolo."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    att = np.clip(t / 1.2, 0, 1); rel = np.clip((dur - t) / 1.2, 0, 1)
    env = (np.sin(att * np.pi / 2) ** 2) * (np.sin(rel * np.pi / 2) ** 2)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.3 * t)
    sl = np.zeros(n); sr = np.zeros(n)
    for f in freqs:
        for d, side in ((-0.12, 0), (0.12, 1)):
            ph = rng.uniform(0, 2 * np.pi)
            s = np.sin(2 * np.pi * (f + d) * t + ph) + 0.12 * np.sin(2 * np.pi * 2 * (f + d) * t + ph)
            if side == 0: sl += s
            else: sr += s
    return sl * env * trem, sr * env * trem


# chord tones (MIDI).  F3=53
CHORDS = [
    dict(bass=41, pad=[53, 57, 60, 64], arp=[65, 69, 72, 76, 72, 69, 67, 69]),  # Fmaj7
    dict(bass=38, pad=[50, 53, 57, 60], arp=[62, 65, 69, 72, 69, 65, 64, 65]),  # Dm7
    dict(bass=46, pad=[50, 53, 57, 58], arp=[58, 62, 65, 69, 65, 62, 60, 62]),  # Bbmaj7
    dict(bass=36, pad=[48, 52, 55, 57], arp=[60, 64, 67, 69, 67, 64, 62, 64]),  # C6
]

t0 = 0.0
k = 0
while t0 < DUR + 1:
    ch = CHORDS[(k // 2) % 4]
    seg = 2 * BAR if k % 2 == 0 else 0
    if k % 2 == 0:
        pl, pr = pad([hz(m) for m in ch["pad"]], seg + 0.8)
        add(L, t0, 0.030 * pl); add(R, t0, 0.030 * pr)
        b = epiano(hz(ch["bass"]), seg, 0.11)
        add(L, t0, b); add(R, t0, b)
    # arpeggio: eighth notes, softer on off-beats, a few rests for air
    for i, m in enumerate(ch["arp"]):
        if k % 4 == 3 and i >= 6:
            continue
        st = t0 + i * BEAT / 2
        vel = (0.075 if i % 2 == 0 else 0.05) * (1 + 0.1 * rng.uniform(-1, 1))
        s = epiano(hz(m), 1.6, vel)
        pan = 0.5 + 0.25 * np.sin(i * 0.9 + k)
        add(L, st, s * (1 - pan) * 1.4); add(R, st, s * pan * 1.4)
    t0 += BAR
    k += 1

# simple reverb: convolve with decaying noise (different per side)
ir_n = int(SR * 2.2)
ti = np.arange(ir_n) / SR
for buf_name in ("L", "R"):
    ir = rng.standard_normal(ir_n) * np.exp(-ti * 3.0)
    ir[: int(0.012 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    buf = L if buf_name == "L" else R
    nfft = 1 << int(np.ceil(np.log2(len(buf) + ir_n)))
    wet = np.fft.irfft(np.fft.rfft(buf, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(buf)]
    mixed = 0.78 * buf + 0.32 * wet
    if buf_name == "L": L = mixed
    else: R = mixed

# gentle low-pass (one-pole) to take the edge off
def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    # vectorised enough for 60 s via chunks of python loop is slow; use lfilter-like recursion via cumsum trick
    from itertools import accumulate
    y = np.fromiter(accumulate(x * (1 - a), lambda p, v: a * p + v), dtype=float, count=len(x))
    return y

L = lowpass(L, 6000); R = lowpass(R, 6000)

n_out = int(SR * DUR)
L = L[:n_out]; R = R[:n_out]
t = np.arange(n_out) / SR
fade = np.clip(t / 1.5, 0, 1) * np.clip((DUR - t) / 3.0, 0, 1)
fade = np.sin(fade * np.pi / 2) ** 2
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
g = 0.5 / peak  # peak at about -6 dBFS
st = np.stack([L * g, R * g], axis=1)
pcm = (np.clip(st, -1, 1) * 32767).astype("<i2")
with wave.open(out_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out_path, DUR, "s")
