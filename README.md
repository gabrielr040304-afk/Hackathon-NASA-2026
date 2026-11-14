# Hackton-NASA-2026 — Mars Survival Guide

Survival HUD for astronauts on exploratory missions to Mars. Overlays data from NASA missions, such as terrain, weather, radiation and resources, onto the Martian map to plan routes and monitor Marswalks safely. Built for NASA Space Apps Challenge 2026: Interplanetary Survival Guide – Martian Map.

**Live site:** https://gabrielr040304-afk.github.io/Hackton-NASA-2026/

## What it does
1. **Plan:** a 5-step questionnaire (science goal, site, crew, load, day and time) produces a Marswalk plan on a layered map of Mars — route along real rover stops, distance, climb, duration, suit oxygen/water/battery use, radiation dose, and a GO / NO-GO verdict with the reasons.
2. **Walk it:** a first-person 3D simulation of Jezero Crater built from the real 1 m HiRISE terrain, with a helmet HUD (in progress).

Every number on screen is labeled **R** (real NASA/USGS data), **D** (derived from real data), **S** (simulated) or **H** (hypothetical). Data sources: [SOURCES.md](SOURCES.md).

## Run locally
1. `npm run dev` (or `python -m http.server 8000`, or `php -S localhost:8000`)
2. Open http://localhost:8000 (opening `index.html` directly does not work: ES modules need a web server).

## Test
`npm test` (Node's built-in test runner, no packages to install).

## Use of AI
Code was written with the assistance of Claude (Anthropic) under the team's direction. Idea, science choices and review: the team. See [SOURCES.md](SOURCES.md#use-of-ai).

Team docs (Portuguese): [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md), [PROGRESSO.md](PROGRESSO.md).
