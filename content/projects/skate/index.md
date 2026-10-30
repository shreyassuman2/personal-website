---
title: First Try
kicker: In progress
status: wip
titleBoard: true
date: 2026-10-30
weight: 3
summary: An iOS app that watches a clip of you skating, names the trick, and tells you what to fix.
stack: [Python, Flask, yt-dlp, ffmpeg, Create ML]
---

## Problem

Skateboarding tricks are hard. When practicing tricks, it's easy to make mistakes and repeat them over and over again. And finding those mistakes is time consuming and confusing.

The usual fix is to film yourself, pull up a video of someone landing the same trick, and flip between the two trying to spot what's different. It takes forever, and half the time you still can't tell.

First Try does that comparison for you. Film an attempt, and it tells you what trick you did and gives you one specific thing to change, like *"raise your back foot earlier on the ollie."*

## Approach

Right now I'm building the part that recognizes the trick. It starts with four: ollie, kickflip, heelflip, and pop shuv-it.

- **Collect** clips of tricks filmed from the side, from online tutorials and my own sessions.
- **Label** each trick in a small tool I built: mark the moment the tail hits the ground, pick the trick, and note whether it was landed.
- **Train** a model on short clips around each of those moments, so it learns what each trick looks like.
- **Test** it on my own phone videos, since that's what people will actually film.

## Status

The data tools work, and I'm labeling clips now. The next steps are:

- Train the first model and see how accurate it is on my own clips.
- Add feedback by tracking body position during the trick, like how high your back foot comes up.
- Build the iOS app in Swift around both.
