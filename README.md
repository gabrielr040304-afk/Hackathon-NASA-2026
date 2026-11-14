# Hackton-NASA-2026 — Mars Survival Guide

Survival HUD for astronauts on exploratory missions to Mars. Overlays data from NASA missions, such as terrain, weather, radiation and resources, onto the Martian map to plan routes and monitor Marswalks safely. Built for NASA Space Apps Challenge 2026: Interplanetary Survival Guide – Martian Map.

**Live site:** https://gabrielr040304-afk.github.io/Hackton-NASA-2026/

## What it does
1. **Plan:** a 7-step questionnaire covers essential life-support systems, science goal, site, crew, additional equipment, habitat/shielding concept, recorded weather/departure time and an automatic illustrative cost estimate. The map shows sampled slope cautions, a MODEL GO / NO-GO assessment, resource use and a downloadable survival report. Candidate routes are compared using explicit rules.
2. **Walk it:** a first-person 3D simulation of Jezero Crater built from the real 1 m HiRISE terrain, with a helmet HUD (in progress).

Every number on screen is labeled **R** (real NASA/USGS data), **D** (derived from real data), **S** (simulated) or **H** (hypothetical). Data sources: [SOURCES.md](SOURCES.md).

This is an educational Mars prototype, not a flight clearance. No local radiation hazard zones, live solar-event forecast, certified shielding rating or survival probability are available. Outdoor dose uses a historical Gale reference and modeled duration. Hypothetical routes or missing local weather block the planner's assessment. The underlying simulator calculation API is preserved.

The cost report separates automatically calculated hypothetical budgets from a chart of the NASA OIG's historical 2021 SLS/Orion estimate. Unknown costs remain unknown; no actual human Mars mission cost or price per kilometer is asserted. Habitat choice does not automatically change outdoor radiation dose or cost.

## Run locally
1. `npm run dev` (or `python -m http.server 8000`, or `php -S localhost:8000`)
2. Open http://localhost:8000 (opening `index.html` directly does not work: ES modules need a web server).

## Test
`npm test` (Node's built-in test runner, no packages to install).
If the environment prevents child-process spawning (`EPERM`), run `node --test --test-isolation=none "tests/*.test.mjs"`.

## Use of AI
Code was written with assistance from Claude (Anthropic) and Codex (OpenAI) under the team's direction. Recommendations use transparent rules; no live AI service is called. Idea, science choices and review: the team. See [SOURCES.md](SOURCES.md#use-of-ai).

Team docs (Portuguese): [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md), [PROGRESSO.md](PROGRESSO.md).

Meridiani Planum replaces Arcadia in the planner. Its Eagle Crater vicinity is exploratory and lacks a local terrain grid, usable weather and digitized rover waypoints; no numerical walking safety result is offered. In Jezero, green cells pass the project sampled-slope threshold only, yellow/red flag slopes and gray indicates unknown terrain. Gale and Meridiani have no prepared local slope grid. No color indicates radiation safety.
