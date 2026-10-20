---
title: Sleeper
kicker: Personal project
date: 2026-10-10
weight: 2
summary: Pick five albums you like and get one you probably haven't heard, with a reason built from the same signals that ranked it.
role: Solo (design, engine, frontend, evaluation, deploy)
team: Just me
stack: [Python, FastAPI, SQLite, React, Vite, Last.fm API, MusicBrainz]
repo: https://github.com/shreyassuman2/sleeper
demo: https://sleeper-pick.vercel.app/
cover: demo.gif
coverAlt: Searching for five albums in Sleeper and getting one niche recommendation plus four runners-up.
---

## Problem

Most recommenders point you back at what's already popular. I wanted something that takes a handful of albums I like and surfaces a less obvious one, and tells me *why* without making it up.

## Approach

The engine is a pipeline of small, testable steps:

- **Resolve** each pick to a MusicBrainz release group, so deluxe editions and remasters are the same album.
- **Profile** the picks from cleaned Last.fm tags, with junk tags like "seen live" removed.
- **Cluster** mixed picks (two rap, two jazz, one shoegaze) and recommend for the biggest group instead of averaging into mush.
- **Score** candidates by tag similarity plus similar-artist overlap, minus a popularity penalty.
- **Explain** with templates filled from the signals that produced the score. There's no LLM, so the reason always matches the ranking.

Every API call goes through a SQLite cache and a per-API rate limiter, and picks live in the URL so results are shareable without accounts.

## Result

It's live, with CI and a pytest suite. A leave-one-out evaluation gives a **45%** album hit rate in the top 20, against **47%** for a naive similar-artists baseline. That gap is the point: the evaluation rewards predicting albums you already like, and the popularity penalty deliberately trades a little of that for picks you don't know yet.

## My role

Solo project: the scoring engine, API, React frontend, evaluation harness, and deployment on Render and Vercel.
