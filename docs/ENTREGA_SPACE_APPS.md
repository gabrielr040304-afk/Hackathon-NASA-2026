# Entrega no Space Apps — textos prontos para colar

**Como usar (Gabriel):** no site do Space Apps, clique no ícone do perfil → My Team → aba **Project** → **Edit**. Copie cada bloco abaixo para o campo com o mesmo nome. Tudo precisa estar em **inglês**. Troque o que estiver entre `[colchetes]`. Clique em **Save Progress** com frequência e, no fim, em **Submit for Judging**, antes de **domingo 15/11, 23:59** (horário do seu evento local). Dá para reenviar quantas vezes quiser até o prazo.

Antes de enviar, abra cada link numa **aba anônima** para conferir que funciona sem login.

---

## Project Name
Mars Survival Guide: Plan the Marswalk, then walk it

## High-Level Project Summary
Mars Survival Guide is a web tool that helps an astronaut plan a Marswalk and then rehearse it in a helmet heads-up display. A short questionnaire starts with the science goal — signs of ancient life, river sediments, boxwork ridges or shallow ice for a human base — and picks a site: Jezero Crater, Gale Crater or Arcadia Planitia. The tool then draws the route over layered NASA maps (Viking color, MOLA elevation, THEMIS day and night infrared, USGS geology and HiRISE close-ups) and computes distance, climb, steepest slope, duration, suit oxygen, water and battery use, radiation dose and a GO / NO-GO verdict with the reasons. Routes follow the real stops of Perseverance and Curiosity, so every step is on terrain a rover has already crossed. Every number is labeled as real NASA data, derived, simulated or hypothetical, so the crew always knows what they can trust.

## Link to Project Demo
[link público do vídeo de até 30 s (YouTube/Drive) OU dos slides (até 7)]

## Link to Final Project
https://gabrielr040304-afk.github.io/Hackton-NASA-2026/
(code: https://github.com/gabrielr040304-afk/Hackton-NASA-2026)

## Detailed Project Description
**What it does.** NASA maps such as Mars Trek are built for regional and global views, but an astronaut on a Marswalk needs a hyper-local plan: where to step, how steep it gets, how long it takes, and whether the suit and the daylight will last. Our tool answers those questions in two steps.

1. **Plan.** A five-step questionnaire (science goal → site → crew and rover support → equipment load → Martian day and departure time) produces a route on a layered map. The result panel shows distance, total climb, steepest slope, science stops, total duration, return time vs. measured sunset, suit oxygen/water/battery use and reserve, radiation dose and share of NASA's 600 mSv career limit, and a GO / NO-GO verdict. Safety rules flag solo walks (NASA EVAs are done in pairs), slopes above 15° (warning) and 25° (no-go), a suit reserve under 30%, and returns later than one hour before sunset. Each target opens a real rover photo of what the crew will see when they arrive.
2. **Walk it.** A first-person 3D simulation of a 2 × 2 km area around Cheyava Falls in Jezero Crater, built from the real 1 m HiRISE terrain model, with a helmet HUD showing vitals, suit consumables, slope under the feet, air temperature, pressure and radiation. [atualizar quando o 3D estiver pronto]

**Sites and science.**
- *Jezero Crater:* route to Cheyava Falls, the rock that NASA called in September 2025 the best candidate for a sign of ancient life found on Mars, and a second route through the Neretva Vallis river channel up the west slope.
- *Gale Crater:* route through the boxwork ridges Curiosity explored in 2025 — the only site with radiation measured on the ground.
- *Arcadia Planitia:* a hypothetical route at the center of NASA's SWIM shallow-ice pilot study, a candidate region for a human base.

**How it works.** A static website (HTML, CSS and JavaScript, no server) using Leaflet for the map and Three.js for 3D, hosted on GitHub Pages. Map layers stream from NASA's Mars Trek. Python scripts read only the needed bytes of the USGS terrain models (HiRISE 1 m for Jezero, MOLA 463 m for Arcadia) and NASA's weather and rover-traverse feeds. The 3D terrain was checked against Perseverance's own elevation record: −2353.0 m vs. −2352.9 m. The walk model (Tobler's hiking function halved for a suit, effort rising with slope and load, an 8-hour suit) has automated tests.

**Benefits.** It turns scattered mission data into the decisions a crew must make before stepping out, and it is honest about uncertainty: real, derived, simulated and hypothetical values are always labeled.

**What we hope to achieve.** A pattern for EVA planning tools that work at astronaut scale and can be pointed at any site with orbital terrain data and rover observations.

**Tools.** JavaScript, HTML, CSS, Leaflet 1.9.4, Three.js, Python 3 with Pillow, Node.js test runner, GitHub Pages.

## Use of Super Intelligence (SI)
Yes. We used Claude (Anthropic), a large language model, as a coding assistant to write the website code, the data-processing scripts and the tests, and to help find and check NASA data sources. The project idea, the choice of sites, routes and science targets, and the review of every result were done by our team. No AI-generated images, video or audio are used; all images are NASA's. AI use is also stated in the site footer, the README and SOURCES.md.

## NASA Data
- NASA/JPL Mars Trek map layers: Viking MDIM 2.1 color mosaic, MGS MOLA shaded elevation, Mars Odyssey THEMIS day and night infrared mosaics, HiRISE mosaics of Jezero (25 cm) and the Curiosity site.
- USGS–NASA Planetary Geologic Mapping Program: Global Geologic Map of Mars (SIM 3292).
- USGS Mars 2020 Terrain Relative Navigation HiRISE DTM of Jezero (1 m) and MGS MOLA global DEM (463 m).
- Mars 2020 Perseverance: MEDA daily weather, traverse and waypoints (MMGIS), raw images (sols 1168 and 1264), NASA image PIA26401 (Cheyava Falls).
- Mars Science Laboratory Curiosity: REMS daily weather, traverse and waypoints, RAD surface dose (Hassler et al., Science 343, 2014), NASA images PIA26559 and PIA26695 (boxwork).
- NASA SWIM (Subsurface Water Ice Mapping) project: Arcadia Planitia pilot study.
- NASA-STD-3001: 600 mSv career radiation limit.

## Space Agency Partner Data and Other References
- Centro de Astrobiología (CAB, Spain): REMS weather data distribution.
- Planetary Science Institute: SWIM pilot study (LPSC 2019, abstract 2069).
- Tobler, W. (1993), hiking function, used in our walking-speed model.
- Leaflet (BSD-2-Clause), Three.js (MIT), Google Fonts Archivo and Atkinson Hyperlegible (SIL OFL).
- Full list with processing details: https://github.com/gabrielr040304-afk/Hackton-NASA-2026/blob/main/SOURCES.md

---

## Demonstração: vídeo de até 30 segundos

Regras: **no máximo 30 s**; se falarem em português, **legendas em inglês obrigatórias**. Nada de pessoas com menos de 18 anos na imagem. Hospede no YouTube (não listado serve) ou Google Drive com acesso público.

Gravar a tela com o Xbox Game Bar do Windows (`Win + Alt + R` começa e para a gravação).

| Tempo | Na tela | Fala / legenda (inglês) |
|---|---|---|
| 0–3 s | Página inicial do site | "We're [TEAM NAME], for the Interplanetary Survival Guide challenge." |
| 3–8 s | Clicar em "Signs of ancient life" e depois em Jezero | "NASA maps are global. A Marswalk is local. Mars Survival Guide plans it." |
| 8–18 s | Resultado: rota sobre o HiRISE, trocar para a camada térmica, abrir a foto de Cheyava Falls, mostrar o GO | "Real rover stops, five NASA map layers, suit oxygen, sunset and radiation — and a GO or NO-GO." |
| 18–26 s | Visor 3D andando até o alvo [quando estiver pronto; senão, voltar ao questionário com 1 astronauta saindo às 16:30 → NO-GO] | "Then the crew rehearses it in a helmet HUD on the real 1-meter terrain." |
| 26–30 s | Rodapé com as etiquetas R/D/S/H | "Every number says if it's real, derived or simulated. Plan safe. Walk smart." |

## Alternativa: 7 slides (em inglês)
1. Title: Mars Survival Guide — team name, team members, challenge name.
2. The problem: Mars maps are regional; a Marswalk needs a local plan.
3. Our answer: plan → walk it (one image of the planner result).
4. How it works: questionnaire → layered map → GO / NO-GO (screenshot).
5. NASA data: Mars Trek layers, HiRISE terrain, rover weather, traverses, RAD radiation, photos.
6. Honest data: the R / D / S / H labels, and the terrain checked against Perseverance (−2353.0 m vs −2352.9 m).
7. Future: any site with orbital terrain + rover data; live space weather; helmet AR.
