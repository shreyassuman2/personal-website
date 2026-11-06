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
coverAlt: "Spectra demo: the plugin window with a spectrum view, a freeze button, and size, diffuse, shift and mix knobs."
---

## Approach

Spectra is a freeze effect: you play audio through it, hit **freeze**, and whatever was sounding at that moment turns into a pad that holds as long as you want. Instead of looping the raw audio, which tends to click at the loop point, it works in the frequency domain using an FFT.

- **Always listening.** The plugin runs an FFT on the incoming audio all the time and keeps the last ~2 seconds as a ring of frequency snapshots: how loud each frequency is, and its exact pitch. Because the analysis never stops, there's always a moment ready to grab.
- **Instant freeze.** Pressing freeze swaps that ring out for a fresh one instead of copying it, so the capture happens with no delay. The **Size** knob picks how much of the stored moment to use, from a single 20 ms slice to the full 2 seconds.
- **Turning snapshots into sound.** The frozen snapshots are resynthesized back into audio continuously, with the pitch of each frequency kept steady so the pad doesn't warble.
- **No clicks between pads.** Two voices take turns: freezing again starts the new pad on one voice while the old one fades out on the other.
- **Shaping the texture.** Scan, drift, and spread move around inside the captured moment; blur, shift, shimmer, and tone reshape its sound; and **Absorb** slowly blends live input back into the frozen pad so it can evolve.

With every effect running, Spectra uses about **1.8%** of one CPU core, because the audio thread never waits on a lock or allocates memory. An automated test suite checks the audio offline and keeps pitch error under **1 Hz** on every release.
