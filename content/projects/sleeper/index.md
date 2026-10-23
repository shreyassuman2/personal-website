---
title: Sleeper
kicker: Personal project
date: 2026-10-10
weight: 2
summary: Pick five albums you like and get one niche album to play next, plus four runners-up.
stack: [Python, FastAPI, SQLite, React, Vite, Last.fm API, MusicBrainz]
repo: https://github.com/shreyassuman2/sleeper
demo: https://sleeper-pick.vercel.app/
cover: demo.gif
coverAlt: Searching for five albums in Sleeper and getting one niche recommendation plus four runners-up.
---

## Problem

Most music recommenders are either inaccurate or point you towards already well known albums. Sleeper is built to find "sleeper picks": pick 5 albums you like and get 1 niche album to play next plus 4 runners-up, each with a one-line reason built from a scoring index.

## Approach

The engine is a pipeline of small, testable steps:

- **Resolve** each pick to a MusicBrainz release group, so deluxe editions and remasters are the same album.
- **Profile** the picks from cleaned Last.fm tags, with junk tags like "seen live" removed.
- **Cluster** mixed picks (two rap, two jazz, one shoegaze) and recommend for the biggest group instead of averaging into mush.
- **Score** candidates by tag similarity plus similar-artist overlap, minus a popularity penalty.
- **Explain** with templates filled from the signals that produced the score. There's no LLM, so the reason always matches the ranking.

Every API call goes through a SQLite cache and a per-API rate limiter, and picks live in the URL so results are shareable without accounts.

## Result

A leave-one-out evaluation gives a **45%** album hit rate in the top 20, against **47%** for a naive similar-artists baseline. The reason this gap exists is because the evaluation rewards predicting albums you already like, and the popularity penalty deliberately trades a little of that score for less well known picks.
