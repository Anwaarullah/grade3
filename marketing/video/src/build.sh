#!/usr/bin/env bash
# Rebuild the Interactive Maths promo video (1080x1920, 30 fps, about 61.5 s).
#
#   cd marketing/video/src && ./build.sh            # full build -> ../interactive-maths.mp4 and ../poster.png
#   ./build.sh --stills 2,10,30                      # just render a few stills to $WORK/stills for checking
#
# Needs: ffmpeg, node + Playwright (chromium), python3 + numpy (for the music; set SILENT=1 to skip).
# Sources: scenes.html (all scenes, a pure function of time), build.js (frame renderer),
#          music.py (synthesised backing track), qr.svg (from make-qr.py), fonts/ (Nunito, OFL).
# Screenshots and clips are read from ../../assets (captured from the real site).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$HERE/../../assets/clips"
OUT="$HERE/.."
WORK="${WORK:-/tmp/interactive-maths-video}"
WORKERS="${WORKERS:-4}"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
mkdir -p "$WORK/clips"

# ---- 1. cut, crop and speed up the screen recordings into numbered frames -------------
# name | source clip | start s | end s | speed | crop (desktop clips: drop the Parent-corner side panel)
DESK="crop=1360:1200:40:0"
seg() {
  local name=$1 src=$2 ss=$3 to=$4 speed=$5 vf=$6
  local d="$WORK/clips/$name"
  if [ -f "$d/.ok" ] && [ "$(cat "$d/.ok")" = "$*" ]; then return; fi
  rm -rf "$d"; mkdir -p "$d"
  local dur; dur=$(python3 -c "print($to-$ss)")
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$ASSETS/$src" \
    -vf "${vf:+$vf,}setpts=(PTS-STARTPTS)/$speed,fps=30" -q:v 2 "$d/%04d.jpg"
  echo "$*" > "$d/.ok"
  echo "clip $name: $(ls "$d" | grep -c jpg) frames"
}
seg s3  clip-01-build-a-number.mp4          4.0  20.6 3.2  "$DESK"
seg s4  clip-02-sort-3d-shapes.mp4          1.0  15.8 3.0  "$DESK"
seg s5  clip-04-build-a-rectangle.mp4       1.5  8.5  1.75 "$DESK"
seg s6  clip-06-phone-colour-a-fraction.mp4 1.0  9.0  1.85 ""
seg s7a clip-03-clock-hint-and-show-me.mp4  4.6  8.6  1.3  "$DESK"
seg s7b clip-03-clock-hint-and-show-me.mp4  18.6 27.5 2.3  "$DESK"
seg s9  clip-05-finish-three-stars.mp4      3.0  11.5 2.0  "$DESK"

if [ "${1:-}" = "--stills" ]; then
  node "$HERE/build.js" --work "$WORK" --stills "$2"
  exit 0
fi

# ---- 2. render every frame of the HTML timeline -----------------------------------------
rm -rf "$WORK/frames"
node "$HERE/build.js" --work "$WORK" --workers "$WORKERS"
node "$HERE/build.js" --work "$WORK" --poster "$OUT/poster.png"
DUR=$(node -e "const n=require('fs').readdirSync('$WORK/frames').length; console.log((n/30).toFixed(3))")

# ---- 3. music -----------------------------------------------------------------------------
AUDIO_IN=(); AUDIO_OPT=(-an)
if [ "${SILENT:-0}" != "1" ]; then
  python3 "$HERE/music.py" "$WORK/music.wav" "$DUR"
  AUDIO_IN=(-i "$WORK/music.wav")
  AUDIO_OPT=(-map 0:v -map 1:a -af "volume=-2.5dB" -c:a aac -b:a 128k -ar 48000 -shortest)
fi

# ---- 4. encode ----------------------------------------------------------------------------
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/%06d.jpg" "${AUDIO_IN[@]}" \
  -c:v libx264 -preset slow -crf 20 -maxrate 3M -bufsize 6M -profile:v high -level 4.1 -pix_fmt yuv420p \
  -r 30 "${AUDIO_OPT[@]}" -movflags +faststart \
  -metadata title="Interactive Maths: hands-on maths for Grade 3" "$OUT/interactive-maths.mp4"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,pix_fmt -of compact "$OUT/interactive-maths.mp4"
