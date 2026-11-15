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

## Readiness colors and radiation evidence

Checklist colors are project rules [H]: red means at least one essential system is unconfirmed; yellow means all essentials are confirmed but recommended medical equipment, crew capabilities, crew size or added shielding remain incomplete; green means those recommendations are also selected. None certifies radiation safety or a minimum safe real mission. Role labels are project recommendations and may be covered by cross-training.

[NASA reported](https://www.nasa.gov/missions/mars-science-laboratory/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/) a roughly 4% reduction in total RAD radiation near a cliff at Murray Buttes, September 9-21, 2016. This is shown as historical evidence, not mapped as a safe polygon or applied to current routes. No spatial dose map or live solar-event feed is connected. Added handheld imaging/environment kits are hypothetical analogues informed by NASA rover imaging and environmental measurements; masses and prices are simulated/project assumptions.

## Preparation page recommendations

The preparation page evaluates its own selectable systems, separately from later crew roles. All eight essential confirmations yield yellow; adding the three recommended contingency/maintenance procedures yields green. These are hypothetical checklist levels, not certified mission sufficiency. Additional procedure costs are illustrative per-person assumptions and are included in the total. NASA references: [ECLSS technical brief](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-002-eclss.pdf), [hardware maintenance and dust considerations](https://www.nasa.gov/reference/9-0-hardware-and-equipment-vol-2/). Checks do not extend modeled oxygen endurance.

## Terrain caution cells and optional additions

Jezero terrain squares use the bundled USGS HiRISE height grid (~3.9 m resampling). Central differences derive gradients [D]; display cells aggregate 16 by 16 samples (~63 m). The maximum sampled slope is compared to project thresholds: over 15 degrees caution, over 25 degrees avoid steep terrain [S]. A cell contains steep samples; it is not a surveyed exclusion polygon and may include walkable points. Unknown cells are not classified. No radiation class is inferred. Coverage is limited to the bundled 2 km crop.

Optional science rehearsal and redundant data archiving [H] have illustrative costs and do not change preparation readiness, radiation exposure or suit capacity. Jezero currently supplies two curated route scenarios, not an exhaustive inventory of trails.

## Short route scenarios

The planner constructs two extra hypothetical [H] out-and-back scenarios by truncating existing NASA rover waypoint sequences [R]: Jezero to the Neretva channel-floor stop (sol 1168), and Gale to the boxwork ridge stop (sol 4628). The base and human walk remain hypothetical. Waypoints are linked by straight segments; gaps, current hazards and radiation are not surveyed, and rover traversability does not certify human safety. The planner compares them using its existing model. See [NASA Perseverance location map](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/) and [NASA Curiosity traverse](https://mars.nasa.gov/files/mep/CuriosityPoster-small.pdf).

## Meridiani and coverage update

Opportunity landed at 1.9483 S, 354.47417 E, in Eagle Crater ([NASA mission](https://science.nasa.gov/mission/mer-opportunity/)). The hypothetical nearby route and base are not Opportunity waypoints. MOLA 463 m altitude -1384 m was retrieved for nearby sample locations with tools/mola_elev.py; this coarse data cannot establish a walking slope. Local rover traverse, weather and fine terrain are not yet integrated; numeric walk results are withheld. [NASA final traverse](https://www.nasa.gov/image-article/opportunitys-final-traverse-map/) and [geology](https://science.nasa.gov/resource/geologic-setting-of-opportunity-traverse-and-meridiani-planum/).

Jezero now colors valid low-slope cells green, warning cells yellow and steep cells red; invalid cells are gray. Green is a model slope criterion, not a safety clearance. Gale and Meridiani show a gray illustrative area indicating missing local elevation grids, not a surveyed boundary. Radiation, rocks and other hazards remain unclassified.

## Jezero interactive simulator

The shared three-route scene uses the bundled USGS HiRISE height grid and NASA orbital texture; rendering resamples the grid to a 256-segment mesh [D]. Camera, movement, visit detection, suit resource use, accelerated time and dose accumulation are simulated [S]. Weather temperature is interpolated from a historical MEDA day; radiation is the historical Gale reference, not Jezero dosimetry. Survey-scale heights do not resolve all rocks or obstacles. No probability of survival is inferred.

The planner transfers preparation using same-tab session storage. Simulator entry repeats planner checks and rejects missing essentials or blocked plans. Projection uses observed average effort; it does not forecast new hazards. TypeScript implementation was requested by the user and uses Three.js 0.187.0; generated JavaScript is committed for static hosting.

## Simulator route guidance and view detections

The route ribbon samples horizontal segments every 2 m and uses the same triangle interpolation as the rendered terrain, with a display-only elevation offset. No new route survey is implied. View detections flag local terrain slope [D] against project thresholds [S] or existing rover science targets [R]. Distance, visibility and arrival are simulated. Radiation is not spatially detected; the simulator has no directional dosimeter or Jezero radiation map.
# Evidence-linked science investigations (2026-11-14)

- [NASA/JPL: potential biosignatures in Sapphire Canyon](https://www.jpl.nasa.gov/news/nasa-says-mars-rover-discovered-potential-biosignature-last-year/) (September 10, 2025): evidence context for Cheyava Falls; not confirmed life. Rendered rocks are hypothetical and do not reproduce measured mineral distributions.
- [NASA: Cheyava Falls and Neretva Vallis](https://www.nasa.gov/solar-system/nasas-perseverance-rover-scientists-find-intriguing-mars-rock/): ancient river and sediment context, not a present water supply.
- [NASA: Curiosity boxwork investigations](https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-rover-sees-martian-spiderwebs-up-close/): resistant ridges and ancient groundwater. The Gale science map uses the existing rover stops; no local terrain mesh is fabricated.
- [NASA GISS Mars24 technical notes](https://www.giss.nasa.gov/tools/mars24/help/notes.html): mean sol duration, 88775.244 SI seconds. Used to convert elapsed SI durations to local Mars-clock minutes in planning and simulation.
- [NASA GISS Mars24 guide](https://www.giss.nasa.gov/tools/mars24/help/guide.html): solar-time and sunrise/sunset calculation capabilities. Sunrise calculations do not account for local topography. No Mars24 prediction is presented as a weather measurement in this app.
- [NASA Opportunity science highlights](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/): ancient-water evidence at Meridiani. Meridiani is excluded from selectable EVAs because this project lacks sufficient verified local route/terrain data, not because solar times cannot be calculated.

Science marker coordinates come from the bundled rover stops and only approximate the science location. Added objects, geometry and rock distribution are [H]; target distance and visits are [S]. No quantitative rock-density product has been prepared. Selected tools support a simulated investigation log without fabricated readings. AI assisted this implementation and source synthesis; scientific claims are linked to the official sources above.

## Gale terrain and habitat refinement

- [HiRISE DTM ESP_019698_1750 / ESP_019988_1750](https://www.uahirise.org/dtm/ESP_019698_1750): PDS product DTEEC_019698_1750_019988_1750_U01, source scale approximately 1.012 m/pixel. `tools/prep_gale.py` reads the PDS projection and float32 samples using HTTP ranges, rejects voids and crops a 1.6 km square to 512 x 512 samples. Terrain is bilinearly resampled [D]; all route points are inside valid coverage. Independent rover-stop elevations differ by approximately 11?15 m from this older orbital DTM and are not silently aligned. The scene samples the orbital grid; planner waypoint statistics retain their recorded elevations.
- Gale texture: Mars Trek `curiosity_hirise_mosaic`, prepared with `tools/prep_texture.py --gale`, using Pillow 13.0.0. Grayscale orbital image receives an illustrative surface tint; this is not calibrated ground color.
- [NASA Mars Surface Habitat concept study](https://ntrs.nasa.gov/citations/20230014593): pressure habitat and architecture context. The authored model is [H], with illustrative dimensions and subsystem layout. It is not NASA CAD or a landed vehicle. Shielding changes do not establish protection ratings.
- [Curiosity studies nodules on boxwork](https://science.nasa.gov/photojournal/curiosity-studies-nodules-on-boxwork-formations/): evidence for nodules and central fractures. Added ridge geometry and trail specimens illustrate regional observations [H]; they are not individually geolocated discoveries.
- [Curiosity drilling at Nevado Sajama](https://science.nasa.gov/blog/curiosity-blog-sols-4716-4722-drilling-success-at-nevado-sajama/): drill investigation context at the Monte Grande campaign. The rendered drill hole is illustrative and the stop coordinate is approximate.
- [Perseverance view of Neretva Vallis](https://science.nasa.gov/photojournal/perseverances-view-of-neretva-vallis-river-channel/): ancient river context. No current surface-water body or water-extraction target has been verified in this scene. A DEM records elevation, not water composition or availability.

AI assisted source review and code generation. The actual observations above are distinguished from procedural texture, scene geometry, positions of optional specimens and simulated inspections.

## Cost and radiation correction (supersedes earlier illustrative costing)

Unsupported prices for life support, science tools, maintenance, habitats, rovers and operations have been removed from the catalog, planner, reports and simulator. No defensible item-level Mars price can be derived from the sources used here. The [NASA OIG IG-22-003 report](https://oig.nasa.gov/wp-content/uploads/2024/02/ig-22-003.pdf), pp. 22?23, provides the historical SLS/Orion production/operations estimate of approximately $4.1B per launch, with components $2.2B, $1B, $300M and $568M. This is a historical program benchmark, not a current offer or a Mars mission price. Components total $4.068B before display rounding. Program development budgets cannot be used as per-suit or per-astronaut prices.

[NASA: Curiosity radiation observations near Murray Buttes](https://www.nasa.gov/missions/mars-science-laboratory/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/) documents a measured decrease near a cliff. It motivates displaying terrain obstruction; it does not calibrate arbitrary topography at either walking site. `js/radiation.js` samples 24 azimuths out to 250 m at 10 m intervals, taking the greatest above-observer elevation angle in each direction. The mean sine of these horizon angles estimates blocked upper-hemisphere solid angle [D]. Sampling parameters and the "more open" display threshold are project choices [S]. Values depend on the available DTM and exclude objects, unmodeled distant terrain and radiation transport through material. An incomplete boundary scan is explicitly flagged.

The accumulated HUD dose continues to use the existing historical Gale RAD reference of 0.64 mSv per Earth day times elapsed SI time [S]; terrain visibility never multiplies this dose. Jezero explicitly uses a transferred Gale reference. More open sky suggests less terrain shielding, but no local rate, shielded-dose reduction, solar-particle risk, certified shelter or safe-zone classification is calculated.
