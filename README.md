# Hackton-NASA-2026 — Mars Survival Guide

Survival HUD for astronauts on exploratory missions to Mars. Overlays data from NASA missions, such as terrain, weather, radiation and resources, onto the Martian map to plan routes and monitor Marswalks safely. Built for NASA Space Apps Challenge 2026: Interplanetary Survival Guide – Martian Map.

**Live site:** https://gabrielr040304-afk.github.io/Hackton-NASA-2026/

## What it does
1. **Plan:** an 8-step questionnaire covers essential life-support systems, science goal, site, crew, additional equipment, habitat/shielding concept, recorded weather/departure time and an automatic illustrative cost estimate. The map shows sampled slope cautions, a MODEL GO / NO-GO assessment, resource use and a downloadable survival report. Candidate routes are compared using explicit rules.
2. **Walk it:** a first-person 3D simulation of Jezero Crater built from the real 1 m HiRISE terrain, with science navigation, field investigations and a helmet HUD.

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

## Jezero helmet simulator

Start from a permitted Jezero plan to transfer preparation through session storage. All three routes share the bundled HiRISE height grid and orbital texture. Desktop: WASD/arrows, mouse look, E inspect, M route map, Escape pause/finish. Simulation supports real time and 30x time; movement and resource use share the time scale. The simulator blocks slopes above the project limit and movement outside terrain coverage.

The HUD uses selected equipment and the existing suit/effort model. No individual rocks, solar events or survival probabilities are modeled. Esc opens a paused review; ending gives consumption and duration projections at observed average effort. Financial investment is shown separately; no validated incremental EVA rate is available.

TypeScript sources: `js/sim/main.ts` and `model.ts`. User-authorized stack extension; deployable JavaScript is committed. Regenerate with `npm run compile:sim` using Node 24 built-in type erasure; no packages or browser compilation required. This command erases types and does not perform semantic TypeScript checking.
### Evidence-linked EVA update

Jezero now includes persistent science navigation, sourced observation guidance, hypothetical field objects and a complete preparation manifest (Esc). Approach a science stop, press **E**, then record an investigation; it consumes modeled stationary science time. **M** shows the route and named science stops. The EVA analysis separates the recorded session from hypothetical longer-duration projections.

Objectives and route alternatives are filtered by destination. Gale includes a science-stop map and a separate HiRISE terrain grid for both boxwork routes. Meridiani is excluded from selectable EVAs because local verified route/terrain data are incomplete. Its solar times are calculable, but a daylight calculation alone cannot validate a walk.

Rover-stop markers approximate science locations. Added rocks, base and rover are hypothetical, not surveyed objects. Potential biosignatures do not confirm life; ancient-water evidence does not identify drinking water. AI-assisted changes and source references are documented in [SOURCES.md](SOURCES.md) and [ADR-003](docs/adr/ADR-003-science-eva.md).

### Gale 3D and surface habitat

Both Gale routes now run in the visor: Boxwork formations and Boxwork ridge - short. Each uses a 1.6 km HiRISE crop and Mars Trek orbital texture. Inspect required science stops with E; optional illustrative trail specimens add five minutes of modeled observation time. The habitat includes a pressure module, airlock, terrain-adjusted supports, power, cooling and communications equipment, with visible changes for selected shielding, tools, procedures and support rover. Its geometry is a project concept informed by NASA studies.

Water objectives concern ancient-water evidence preserved in rocks. Topography alone does not identify liquid water or an extractable deposit. Added geological details remain hypothetical reconstructions; reference images and NASA links explain the real observations.

### Cost and radiation evidence correction

Unsupported per-item prices and automatic Mars mission totals have been removed. Only the NASA OIG 2021 SLS/Orion benchmark remains, with its historical scope and source. USD values use M below one billion and B from one billion; unknown costs remain unavailable.

Both simulators include a radiation panel: accumulated historical-reference dose, reference rate and position-dependent terrain sky visibility. The latter is derived from the local elevation grid and is a geometric context indicator, not a dose-rate measurement. No universal terrain shielding factor, solar-event prediction or local radiation map is invented.
