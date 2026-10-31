"""Generates short original demo tracks (plucked melody, drone, soft tabla pulse) as WAV files."""
import math
import random
import struct
import wave
from pathlib import Path

SR = 22050
MUSIC_DIR = Path(__file__).resolve().parent / "music"

# (file name, tempo, tonic MIDI note, scale semitones, bars, seed)
TRACKS = [
    ("purani-dhun-demo", 76, 62, [0, 1, 3, 5, 7, 8, 10], 20, 11),
    ("chai-ke-saath-demo", 88, 60, [0, 2, 4, 7, 9], 22, 23),
    ("raat-ki-barish-demo", 68, 65, [0, 2, 3, 5, 7, 8, 11], 18, 37),
]
TITLES = {
    "purani-dhun-demo": "Purani Dhun (Demo)",
    "chai-ke-saath-demo": "Chai Ke Saath (Demo)",
    "raat-ki-barish-demo": "Raat Ki Barish (Demo)",
}


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add_note(buf, start, dur, freq, amp, harmonics=(1.0, 0.4, 0.15), decay=3.5):
    s0 = int(start * SR)
    n = min(int(dur * SR), len(buf) - s0)
    for i in range(max(n, 0)):
        t = i / SR
        env = math.exp(-decay * t / dur) * min(1.0, t / 0.004)
        v = 0.0
        for k, h in enumerate(harmonics, 1):
            v += h * math.sin(2 * math.pi * freq * k * t)
        buf[s0 + i] += amp * env * v


def add_thump(buf, start, amp):
    s0 = int(start * SR)
    for i in range(int(0.25 * SR)):
        if s0 + i >= len(buf):
            break
        t = i / SR
        buf[s0 + i] += amp * math.exp(-18 * t) * math.sin(2 * math.pi * (55 + 90 * math.exp(-30 * t)) * t)


def render(name, bpm, tonic, scale, bars, seed):
    rnd = random.Random(seed)
    beat = 60 / bpm
    total = bars * 4 * beat + 3
    buf = [0.0] * int(total * SR)

    degrees = len(scale)
    span = degrees * 2
    pos = degrees // 2

    def note_midi(idx):
        return tonic + 12 * (idx // degrees) + scale[idx % degrees]

    for bar in range(bars):
        t0 = bar * 4 * beat
        # Drone: tonic and fifth, re-plucked each beat like a tanpura.
        for b, m in enumerate([tonic - 5, tonic, tonic, tonic - 12]):
            add_note(buf, t0 + b * beat, beat * 3, mtof(m - 12), 0.05, harmonics=(1, 0.6, 0.35, 0.2), decay=1.5)
        for b in (0, 2):
            add_thump(buf, t0 + b * beat, 0.35 if b == 0 else 0.22)
        add_thump(buf, t0 + 3.5 * beat, 0.1)

        # Melody on half-beat steps with occasional rests.
        step = 0
        while step < 8:
            if rnd.random() < 0.3:
                step += 1
                continue
            pos = max(0, min(span - 1, pos + rnd.choice([-2, -1, -1, 0, 1, 1, 2])))
            length = rnd.choice([1, 2, 2, 3])
            dur = min(length, 8 - step) * beat / 2
            add_note(buf, t0 + step * beat / 2, dur * 1.8, mtof(note_midi(pos)), 0.16)
            step += length

    # Soft echo for a lo-fi room feel.
    delay = int(beat * 0.75 * SR)
    for i in range(delay, len(buf)):
        buf[i] += 0.3 * buf[i - delay]

    peak = max(1e-9, max(abs(x) for x in buf))
    fade = int(2 * SR)
    for i in range(fade):
        buf[-1 - i] *= i / fade
    path = MUSIC_DIR / f"{name}.wav"
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(0.85 * x / peak * 32767)) for x in buf))
    return path


def ensure_demo_tracks():
    MUSIC_DIR.mkdir(exist_ok=True)
    for name, *args in TRACKS:
        if not (MUSIC_DIR / f"{name}.wav").exists():
            print(f"Generating {name}.wav ...")
            render(name, *args)


if __name__ == "__main__":
    ensure_demo_tracks()
