---
title: Spectra
kicker: Personal project
date: 2026-11-05
weight: 1
summary: A free audio plugin that captures a moment of sound and stretches it into a pad using FFT.
stack: [C++, JUCE]
repo: https://github.com/shreyassuman2/spectra
demo: https://github.com/shreyassuman2/spectra/releases/latest
demoLabel: Download
cover: demo.gif
coverFit: contain
video: showcase.mp4
coverAlt: "Spectra demo: the plugin window with a spectrum view, a freeze button, and size, diffuse, shift and mix knobs."
---

Spectra is a freeze effect: play audio through it, hit **freeze**, and whatever was sounding turns into a pad that holds as long as you want. Looping the raw audio would click at the loop point, so Spectra works in the frequency domain with an FFT instead.

- **Instant capture.** An FFT runs on the input all the time and keeps the last ~2 seconds ready, so freezing grabs the moment with no delay. **Size** sets how much of it plays, from a 20 ms slice to the full 2 seconds.
- **Clean, steady sound.** Each frequency's pitch is held in place so the pad doesn't warble, and every capture crossfades with the one before it, so there are no clicks.
- **Shaping the texture.** Knobs move around inside the captured moment, blur and shimmer it, and **Shift** it by semitones. **Absorb** slowly blends live input back in so the pad evolves.

Version 1.1 added tempo-synced re-freeze: while the song plays, Spectra can grab a new moment every bar, 1/2, 1/4 or 1/8, so the pad follows the music without drawing automation. I'll probably add modulation in a future version.

With every effect running, Spectra uses about **1.8%** of one CPU core, because the audio thread never waits on a lock or allocates memory. An automated test suite checks the audio offline on every release and keeps pitch error under **1 Hz**.
