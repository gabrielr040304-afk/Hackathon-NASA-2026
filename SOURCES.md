# Data sources and credits

Labels used in the interface: **[R]** real (measured or published by NASA/USGS) · **[D]** derived (calculated by us from real data) · **[S]** simulated (our model) · **[H]** hypothetical (our proposal).

Every value on screen carries one of these labels. We never present a derived or simulated value as a NASA measurement.

## Data used

| Data | Label | Source | Our processing |
|---|---|---|---|
| Map layers: Viking color mosaic (232 m), MOLA shaded elevation (463 m), THEMIS day and night infrared (100 m) | R | NASA/JPL Mars Trek WMTS tiles (`trek.nasa.gov/tiles/Mars/EQ/...`) | Shown as-is in Leaflet |
| Global geologic map SIM 3292 | R | USGS Astrogeology via Mars Trek | Shown as-is |
| HiRISE detail mosaics: Jezero (25 cm) and Curiosity site | R | Mars Trek (`JEZ_hirise_soc_006_orthoMosaic_25cm`, `curiosity_hirise_mosaic`) | Shown as-is, with an opacity slider |
| 3D terrain of Jezero (`data/jezero/terrain.bin`) | R (heights) / D (resampling) | USGS Mars 2020 TRN HiRISE DTM `JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m` | 2 × 2 km crop centered at 18.4975° N, 77.305° E, block-averaged from 1 m to ~3.9 m (512 × 512) — `tools/prep_terrain.py`. Checked against Perseverance's sol 1206 elevation: −2353.0 m vs −2352.9 m |
| 3D texture (`data/jezero/texture.jpg`) | R | Jezero HiRISE mosaic (25 cm) via Mars Trek, zoom 15 (~1.2 m/px) | Tiles stitched and cropped to the same bounding box, 2048 × 2048 — `tools/prep_texture.py` |
| Jezero weather (`data/weather/jezero.json`) | R | MEDA/Perseverance, `mars.nasa.gov/rss/api/?feed=weather&category=mars2020` (sols 1130–1133, April 2024) | Only sols with measured temperature and pressure — `tools/prep_data.py` |
| Gale weather (`data/weather/gale.json`) | R | REMS/Curiosity (Centro de Astrobiología), `...category=msl`, outreach use | Latest 60 valid sols — `tools/prep_data.py` |
| Rover traverses (`data/traverse/`) | R | `mars.nasa.gov/mmgis-maps/{M20,MSL}/Layers/json/*_traverse.json` | Unchanged |
| Jezero routes | R (points) / H (base) | Perseverance stops, `M20_waypoints.json`, sols 1142–1264 | Stops every ~100 m, out and back on the same path; base on a point with slope < 5° in the HiRISE DTM |
| Gale route | R (points) / H (base) | Curiosity stops, `MSL_waypoints.json`, sols 4580–4709 (boxwork campaign; Curiosity blog: sols 4627–4628 ridge, 4709–4715 drilling) | Stops every ~100 m |
| Arcadia route | H (route) / R (elevations) | Center of the SWIM pilot-study map in Arcadia, 196° E, 47.25° N (SWIM/PSI, LPSC 2019, abstract 2069); elevations from MOLA 463 m (USGS) | Hypothetical base and targets within 1.5 km; elevations read from the remote GeoTIFF — `tools/mola_elev.py` |
| Surface radiation dose | R (Gale) / reference elsewhere | 0.64 mSv/day, Curiosity RAD (Hassler et al., *Science* 343, 2014) | Dose = rate × walk hours / 24 |
| Career radiation limit | R | 600 mSv, NASA-STD-3001 | Shown as a percentage |
| Cheyava Falls photo | R | NASA PIA26401, "Mastcam-Z Views the 'Cheyava Falls' Workspace" — NASA/JPL-Caltech/ASU/MSSS | Resized to 1200 px |
| Neretva Vallis photo | R | Perseverance, sol 1168, NLF_1168_0770638338_771ECM_N0525032NCAM02168_04_195J (Navcam) — NASA/JPL-Caltech | 800 px raw-gallery version |
| West slope photo | R | Perseverance, sol 1264, NLF_1264_0779152935_617ECM_N0590330NCAM02264_01_195J (Navcam) — NASA/JPL-Caltech | 800 px raw-gallery version |
| Boxwork ridge photo | R | NASA PIA26559, "Curiosity's First 360-Degree View of Boxwork Patterns" — NASA/JPL-Caltech/MSSS | Resized to 1200 px |
| Monte Grande photo | R | NASA PIA26695, "Curiosity Lights Up 'Nevado Sajama' at Night" — NASA/JPL-Caltech/MSSS | Resized to 1200 px |
| Target descriptions | R (facts) | NASA/JPL announcements on Cheyava Falls (July 2024) and the Sapphire Canyon sample (September 2025); Curiosity blog | Our own summary |

## Simulated model (labeled S on screen)

Walking speed uses Tobler's hiking function halved for the suit; effort grows +3% per degree of uphill slope and +1% per kilogram carried; the suit supports 8 hours at rest effort; walks must end with at least 30% reserve and 60 minutes before sunset. All constants live in `js/config.js`. This is a demonstration model, not a medical or engineering prediction.

## Readiness, shielding and cost context

- [NASA Spacewalk Spacesuit Basics](https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/): pressure garment, oxygen circulation, CO₂ removal and cooling. The app's readiness checklist is a hypothetical project requirement, not a NASA certification checklist. Unconfirmed items block the planner.
- [NASA shielding research](https://science.nasa.gov/resource/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/): background for hydrogen-rich shielding. Metal pressure shells, polymer layers and regolith-covered habitats are qualitative concepts [H]. No thickness, dose-reduction percentage, construction mass or thermal score is assigned.
- [NASA OIG IG-22-003, November 15, 2021, pp. 22–23](https://oig.nasa.gov/wp-content/uploads/2024/02/ig-22-003.pdf): historical published SLS/Orion production and launch-operation estimates [R]. Chart components: SLS $2,200M, Orion $1,000M, ESA service-module barter $300M and ground systems $568M at an annual launch cadence. Their sum is $4,068M [D], rounded by OIG to approximately $4.1B. These are estimates, not actual expenditures or current Mars prices. Prior development and a complete surface mission are excluded. User budgets and their sums are hypothetical [H]; blank amounts are unknown, never zero.
- User-provided challenge resources: [Mars Trek](https://trek.nasa.gov/mars/), [USGS Mars maps](https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars), [Curiosity proposed path](https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/) and [Perseverance raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/). [Worldview](https://worldview.earthdata.nasa.gov/) depicts Earth and supplies no Mars hazards. The 2026 challenge page could not be retrieved during this review; alignment follows the supplied brief and approved plan.

Route rankings first compare model blockers, then sampled maximum slope, duration and reserve. An existing rover traverse does not certify a human route. Slope markers [D] connect waypoint elevations; their warning thresholds are simulated [S], and small hazards between samples are unresolved. Radiation dose multiplied by simulated duration is labeled [S]. No spatial radiation measurements or live space-weather alerts are connected; neither crater imagery nor geology is used to invent dose zones. Sunrise/sunset restrict the scenario daylight window but do not establish an optimal radiation-safe departure hour. Missing local weather or hypothetical routes block the planner's assessment.

## Credits
- Mission images and data: NASA/JPL-Caltech.
- HiRISE: NASA/JPL/University of Arizona.
- Mars 2020 TRN terrain and mosaics, SIM 3292 geologic map, MOLA DEM: USGS Astrogeology.
- REMS weather (Curiosity): Centro de Astrobiología (CAB), outreach data.
- Libraries: Leaflet 1.9.4 (BSD-2), Three.js (MIT). Fonts: Archivo and Atkinson Hyperlegible (SIL Open Font License).

## Use of AI
Code and data-processing scripts were written with assistance from Claude (Anthropic) and Codex (OpenAI) under the team's direction. The readiness/report extension and deterministic recommendation rules were developed with Codex. No live AI is used to invent hazards or forecast conditions. The project idea, science choices and review belong to the team. No AI-generated images, video or audio are used; all images are NASA's.

## Illustrative automatic mission budget

The project assigns hypothetical costs [H] in `js/config.js` to each selected life-support system, equipment item, habitat, rover and operations. Suit systems and equipment are multiplied by crew count; a 20% hypothetical contingency is added to the subtotal. The subtotal also includes one historical OIG launch-system component sum [D]. This is a teaching scenario, not an actual or NASA-estimated Mars mission price. It does not independently price Mars landing, transit or return. Individual assumptions have no NASA cost source.

## Crew and propulsion concepts

NASA?s [2025 architecture update](https://www.nasa.gov/wp-content/uploads/2025/12/2025-architecture-update-for-publication.pdf) targets at least four crew on Mars, and considers six. NASA studies [nuclear thermal propulsion](https://www.nasa.gov/space-technology-mission-directorate/tdm/space-nuclear-propulsion/); neither the propulsion selection nor support rover is a validated human Mars vehicle. The selection does not alter route duration or mission cost.
