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
splat: true
coverAlt: "Spectra demo: the plugin window with a spectrum view, a freeze button, and size, diffuse, shift and mix knobs."
---

## Approach

Spectra is a freeze effect: play audio through it, hit **freeze**, and whatever was sounding turns into a pad that holds as long as you want. Looping the raw audio would click at the loop point, so Spectra works in the frequency domain with an FFT instead.

- **Always listening.** An FFT runs on the input all the time and keeps the last ~2 seconds as a ring of frequency snapshots, so there's always a moment ready to grab.
- **Instant freeze.** Freezing swaps that ring for a fresh one instead of copying it, so the capture has no delay. **Size** sets how much of the moment plays, from a 20 ms slice to the full 2 seconds.
- **Steady pitch.** The snapshots are resynthesized continuously with each frequency's pitch held in place, so the pad doesn't warble.
- **Re-freeze in time.** New in 1.1: while the song plays, Spectra can capture a new moment every bar, 1/2, 1/4, or 1/8, so the pad follows the music without drawing automation.
- **No clicks.** Each capture starts on its own voice and crossfades with the one before it, even when re-freezes land faster than the old pad fades out.
- **Shaping the texture.** Scan, drift, and spread move around inside the captured moment; blur, shimmer, and tone reshape it; **Shift** snaps to semitones with a menu of octaves, fifths, and fourths; and **Absorb** slowly blends live input back in so the pad evolves.

With every effect running, Spectra uses about **1.8%** of one CPU core, because the audio thread never waits on a lock or allocates memory. An automated test suite checks the audio offline on every release and keeps pitch error under **1 Hz**.
