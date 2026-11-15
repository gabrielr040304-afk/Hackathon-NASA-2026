# ADR-003: Evidence-linked EVA investigations

Status: implemented locally, 2026-11-14, following the requested simulator refinement.

The destination now limits the offered science objectives and route alternatives. Jezero supports the prepared biosignature and sediment routes; Gale supports the prepared boxwork map. Gale remains a map/planning experience because there is no bundled local DEM for a credible 3D surface.

Meridiani is removed from selectable EVA destinations. Its archived entry remains in `data/sites.json` for provenance and existing validation. This is a dataset-readiness decision, not a claim that walking there is physically impossible. NASA Mars24 can calculate solar times without a surface weather station, but a clock cannot establish route traversability. A verified local traverse and suitable terrain are still missing from this prototype.

`js/science.js` associates each prepared science stop with official evidence, observation guidance and relevant selected tools. Markers retain rover-stop coordinates; they are not centimeter-accurate rock positions. No resource deposit, rock abundance survey, life detection or instrument measurement is invented. Nearby instanced rock meshes are deterministic illustrations [H], not photogrammetric reconstructions. Base and optional rover geometry are also [H].

The simulator presents persistent target bearing and distance separately from directional slope detection. The paused manifest preserves all preparation choices; only load and mobility influence existing walking calculations. Recording a science stop consumes the same stationary science duration used by the planner, once per target. Opening a reference photo alone does not count as completing an investigation.

Mission durations, battery and metabolic consumption use SI hours. The local 24-hour Mars clock converts SI seconds with the mean sol duration of 88775.244 seconds from NASA GISS. Recorded weather clocks are still used as supplied: there is no new ephemeris calculation, terrain-horizon model or live weather forecast. Daylight return margin remains a project assumption expressed in Mars clock minutes.

Rendering uses instanced field rocks, bounded device-pixel ratio and a throttled DOM HUD. No frame-rate improvement is claimed without measurement. Analysis separates the actual session, science log and a clearly hypothetical extension; it does not estimate survival.

Validation: 31 Node tests, JavaScript syntax and diff checks. Automated visual/WebGL testing could not run: browser host unavailable; native browser windows could not be inspected while minimized. Manual desktop validation remains required before presentation.
