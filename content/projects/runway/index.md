---
title: Runway
kicker: AWS × ACM SCU Hackathon
date: 2026-11-08
weight: 2
summary: An AI finance team for early-stage startups. It catches wasted spend and negotiates vendor renewals by email.
role: Built the backend core, AWS deploy, dashboard and card terminal; merged and integrated the team's work
team: 4 people, 2 days
stack: [Python, AWS Lambda, DynamoDB, Amazon Bedrock, FastAPI, SES, JavaScript]
repo: https://github.com/shreyassuman2/hackathon-aws
cover: demo.gif
coverAlt: "Runway demo: the dashboard's Overview, AI spend and SaaS tabs, the founder texting Runway questions over iMessage, approving a Cursor renewal negotiation, and the negotiation emails in Gmail."
---

## Problem

Early-stage startups can't afford finance hires, so nobody watches the money. AI API bills spike, SaaS seats sit unused, subscriptions renew at full price, and expense policy only gets checked when someone remembers.

## Approach

Every card swipe goes through a pipeline. A router sends known vendors to Claude Haiku. Founder policies can auto-approve or auto-cancel. Then a specialist agent (Claude Sonnet on Bedrock) looks at it for one of three things:

- **AI spend:** week-over-week spikes, expensive models doing cheap work, forgotten batch jobs.
- **SaaS sprawl:** dormant seats, overlapping tools, shadow IT, upcoming renewals.
- **Compliance:** charges over the cap, missing memos, red-flag merchants. It asks the employee before it bothers the founder.

Alerts pass through a restraint filter that decides whether to text the founder now, during business hours, or in a daily digest. The founder approves with a one-tap iMessage reply ("y"). Runway then negotiates the renewal with the vendor by email across days and reports back.

{{< shot-pair a="texts.gif" aAlt="iMessage thread: Runway flags a $1,400 Cursor charge with 8 of 14 seats dormant, the founder replies Y, and Runway reports each negotiation round until it closes at 22% off, saving $3,696 a year." b="emails.gif" bAlt="Gmail thread: Runway asks Cursor for 20% off, Cursor offers 10%, Runway pushes back, Cursor offers 18%." caption="The founder replies **Y** by text. Runway handles the vendor emails and texts back after each round." >}}

A few rules keep it safe:

- Only one module talks to Claude, and every agent has a fixed fallback if Claude is down.
- Anything that moves money needs the founder's approval, unless a policy they set allows it.
- Live email never goes to a guessed vendor address.

It runs on AWS Lambda (API, negotiation worker every 5 minutes, digest), one DynamoDB table and SES, deployed with SAM. It also runs fully locally with no AWS account.

## My role

I set up the repo and wrote the backend core: storage (DynamoDB and local), the Bedrock client, alerts, the restraint filter, policies and the demo company data. I also wrote the AWS deploy and the live-email safety rules, redesigned the dashboard, built the card terminal, and reviewed and merged most of the team's PRs.
