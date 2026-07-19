"""Generate ground-truth input.mp3 (Twinkle Twinkle, first phrase) + ground-truth.json.

Stdlib only for synthesis (wave/math/struct); ffmpeg converts WAV -> MP3.
"""
import json
import math
import struct
import subprocess
import wave
from pathlib import Path

SR = 44100
BPM = 100
QUARTER = 60 / BPM  # 0.6 s

# (midi note, beats) — Twinkle Twinkle first phrase, C major
MELODY = [
    (60, 1), (60, 1), (67, 1), (67, 1), (69, 1), (69, 1), (67, 2),
    (65, 1), (65, 1), (64, 1), (64, 1), (62, 1), (62, 1), (60, 2),
]

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def name(midi):
    return f"{NOTE_NAMES[midi % 12]}{midi // 12 - 1}"


def main():
    here = Path(__file__).parent
    samples = []
    truth = []
    t = 0.0
    for midi, beats in MELODY:
        dur = beats * QUARTER
        freq = 440 * 2 ** ((midi - 69) / 12)
        n = int(dur * SR)
        gap = int(0.04 * SR)  # 40 ms silence between notes -> clean onsets
        body = n - gap
        for i in range(body):
            # 15 ms attack, 60 ms release envelope; fundamental + soft 2nd harmonic
            env = min(1.0, i / (0.015 * SR), max(0.0, (body - i) / (0.06 * SR)))
            v = 0.55 * env * (math.sin(2 * math.pi * freq * i / SR)
                              + 0.25 * math.sin(4 * math.pi * freq * i / SR))
            samples.append(v)
        samples.extend([0.0] * gap)
        truth.append({"midi": midi, "name": name(midi), "onset": round(t, 4),
                      "duration": round(dur - 0.04, 4)})
        t += dur

    wav_path = here / 'input.wav'
    with wave.open(str(wav_path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s)) * 32000))
                               for s in samples))

    (here / 'ground-truth.json').write_text(
        json.dumps({"bpm": BPM, "notes": truth}, indent=2))

    mp3_path = here.parent / 'public' / 'input.mp3'
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav_path),
                    '-codec:a', 'libmp3lame', '-qscale:a', '2', str(mp3_path)],
                   check=True)
    print(f"wrote {mp3_path} ({mp3_path.stat().st_size} bytes), "
          f"{len(truth)} notes, total {t:.1f}s")


if __name__ == '__main__':
    main()
