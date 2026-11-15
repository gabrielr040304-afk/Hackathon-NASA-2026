// Todas as constantes do modelo. Etiqueta: [R] real · [D] derivado · [S] simulado (suposição nossa).
export const MARS_RADIUS_M = 3396190;        // [R] esfera IAU Mars 2000 (mesma do relevo HiRISE)
export const MARS_SOL_SECONDS = 88775.244; // [R] NASA GISS Mars24 mean solar day, SI seconds.
export const SUIT_CAPACITY_H = 8;            // [S] ordem de grandeza das EVAs da NASA
export const RESERVE_PCT = 30;               // [S] reserva mínima ao voltar
export const SUIT_SPEED_FACTOR = 0.5;        // [S] traje reduz a velocidade a pé pela metade
export const LOAD_FACTOR_PER_KG = 0.01;      // [S] +1% de esforço por kg carregado
export const SLOPE_FACTOR_PER_DEG = 0.03;    // [S] +3% de esforço por grau de subida
export const ROVER_KMH = 8;                  // [S] inspirado no rover lunar da Apollo
export const ROVER_MAX_SLOPE_DEG = 15;       // [S]
export const SLOPE_WARN_DEG = 15;            // [S]
export const SLOPE_NOGO_DEG = 25;            // [S]
export const SCIENCE_MIN_PER_TARGET = 30;    // [S]
export const RAD_MSV_PER_DAY = 0.64;         // [R] Curiosity RAD em Gale (Hassler et al., Science 343, 2014)
export const CAREER_LIMIT_MSV = 600;         // [R] NASA-STD-3001
export const DAYLIGHT_MARGIN_MIN = 60;       // [S] voltar 1 h antes do pôr do sol
export const SUIT_PRESSURE_KPA = 29.6;       // [R] traje EMU da NASA (4,3 psi)
export const HR_BASE_BPM = 75;               // [S]
export const HR_PER_EFFORT = 45;             // [S]
export const TIME_SCALE = 30;                // demonstração: 1 s real = 30 s simulados (ajustável)
export const SIM = { eyeHeight: 1.7, mouseSensitivity: 0.002, meshSegments: 256, maxFrameSeconds: 0.1, waypointRadius: 18, fov: 75, far: 6000, projectionMaxHours: 72 };
export const SIM_GUIDANCE = { routeStepM: 2, routeLiftM: 0.35, routeWidthM: .45, scanStepM: 5, scanRangeM: 90, targetRangeM: 350, scanIntervalMs: 180 };
export const ARRIVAL_RADIUS_M = 15;
// Visual geometry [H] and telemetry refresh; no measured rock-density claim.
export const SIM_DETAIL = { hudIntervalMs: 180, pixelRatio: 1.5, rocksPerTarget: 28, rockFieldRadiusM: 24, rockMinM: 0.18, rockMaxM: 1.1, beaconHeightM: 5, baseOffsetM: 10 };
export const HABITAT_VISUAL = { offsetM: 22, collisionRadiusM: 5.8, inspectionRadiusM: 18 }; // [H] scene layout, not NASA engineering dimensions.
export const FIELD_VISUAL = { inspectionRadiusM: 7, trailSpacingM: 55, trailOffsetM: 4, routeWidthM: .35, routeLiftM: .08 }; // [H] illustrative scene geometry and [S] interaction radius.
export const OPTIONAL_FIELD_MIN = 5; // [S] extra observation duration; beyond the planner's required stops.
export const PEAK_TEMP_HOUR = 14;            // [S] hora da temperatura máxima do dia
export const HAZARD_CELL_PIXELS = 16; // Display aggregation only, ~63 m for the bundled Jezero DTM.
export const OPTIONAL_PREPARATION = [
  { id: 'rehearsal', name: 'Integrated EVA operations rehearsal', why: 'Rehearse crew coordination, sample identification, contamination control and abort procedures. Additional mission preparation; does not increase suit endurance.' },
  { id: 'archive', name: 'Redundant science data and sample records', why: 'Maintain independent copies of imagery, instrument records and sample identifiers for traceability. A shared mission provision; does not reduce radiation or extend life support.' },
]; // [H] optional project enhancements; verified unit prices unavailable.
// Additional project recommendations [H], informed by NASA maintenance/contingency research.
export const PREPARATION_EXTRAS = [
  { id: 'backup', name: 'Independent emergency oxygen check', group: 'Contingency and recovery', why: 'Verify the backup supply and abort procedure independently of the primary oxygen system.', source: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-002-eclss.pdf' },
  { id: 'repair', name: 'Suit inspection and repair provision', group: 'Contingency and recovery', why: 'Plan inspection, spare seals and qualified maintenance support; a spare part alone does not qualify a repair.', source: 'https://www.nasa.gov/reference/9-0-hardware-and-equipment-vol-2/' },
  { id: 'dust', name: 'Dust-control and seal inspection procedure', group: 'Dust and equipment care', why: 'Inspect sealing surfaces and control dust transfer when returning to the habitat.', source: 'https://www.nasa.gov/reference/9-0-hardware-and-equipment-vol-2/' },
];
export const RADIATION_EVIDENCE_URL = 'https://www.nasa.gov/missions/mars-science-laboratory/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/';
// Historical comparisons below are program estimates, never Mars unit prices.
export const RADIATION_TERRAIN = { azimuths: 24, stepM: 10, rangeM: 250, eyeHeightM: 1.7, refreshMs: 1000, openSkyFraction: .95 }; // [S] sampling settings; geometry [D].
// [H] unit planning allowances in million USD; PERSONAL_PRICE_IDS scale with crew.
// Reference amounts are published; allocation shares and multipliers are ours.
export const PRICE_REFERENCES = {
  transport: { million: 4068, name: 'NASA OIG 2021: $4.068B SLS/Orion component sum; historical lunar launch-system scope, not Mars transport', url: 'https://oig.nasa.gov/wp-content/uploads/2024/02/ig-22-003.pdf' },
  suit: { million: 228.5, name: 'NASA Axiom Artemis task order, 2022: $228.5M for development/services, not one suit', url: 'https://www.nasa.gov/news-release/nasa-taps-axiom-space-for-first-artemis-moonwalking-spacesuits/' },
  habitat: { million: 65, name: 'NASA NextSTEP, 2016: ~$65M combined prototype/concept awards across six companies, not one habitat', url: 'https://www.nasa.gov/news-release/nasa-selects-six-companies-to-develop-prototypes-concepts-for-deep-space-habitats/' },
  instrument: { million: .07, name: 'NASA Pandora Q&A, 2024: ~$70,000 for a ground-based two-spectrometer system; not Mars-rated handheld hardware', url: 'https://appliedsciences.nasa.gov/sites/default/files/2024-08/GroundNetworks_Q%26A_Part3.pdf' },
  rover: { million: 30, name: 'Intuitive Machines, 2024: $30M lunar vehicle feasibility study, not vehicle purchase or Mars delivery', url: 'https://investors.intuitivemachines.com/news-releases/news-release-details/intuitive-machines-led-moon-racer-team-awarded-nasa-lunar' },
};
export const PRICE_ALLOWANCES = {
  pressure:['suit',.30], oxygen:['suit',.12], scrubber:['suit',.12], cooling:['suit',.10], power:['suit',.10], comms:['suit',.10], monitor:['suit',.04], rescue:['suit',.12],
  backup:['suit',.03], repair:['suit',.04], dust:['suit',.02], rehearsal:['suit',.01], archive:['instrument',2],
  amostrador:['instrument',1], camera:['instrument',1], espectrometro:['instrument',1], perfuratriz:['instrument',3], medico:['instrument',1], microscopia:['instrument',1], ambiente:['instrument',1],
  shell:['habitat',1], polymer:['habitat',1.5], regolith:['habitat',2], rover:['rover',10],
  chemical:['transport',1], nuclear:['transport',1.5],
};
export const PERSONAL_PRICE_IDS = ['pressure','oxygen','scrubber','cooling','power','comms','monitor','backup','amostrador','camera','espectrometro','perfuratriz','medico','microscopia','ambiente']; // [H] one complete personal set per surface crew member.
export const PRICE_GROUPS = {personal:'Personal systems', preparation:'Mission preparation', habitat:'Habitat and mobility', transport:'Interplanetary transport'};
export const SIM_PACING = { maxTimeScale: 6, maxFootVisualMps: 3, maxRoverVisualMps: 4.8 }; // [S] presentation compression; distance, time and consumption share the same elapsed time.

// Planner extension approved by Gabriel: educational readiness, not flight certification.
export const EQUIPMENT = [
  { id: 'amostrador', name: 'Sample collection kit', kg: 4 },
  { id: 'camera', name: 'Field camera', kg: 2 },
  { id: 'espectrometro', name: 'Handheld spectrometer', kg: 5 },
  { id: 'perfuratriz', name: 'Hand drill', kg: 12 },
  { id: 'medico', name: 'Emergency medical kit', kg: 3 },
  { id: 'microscopia', name: 'Close-up texture imaging kit', kg: 2 },
  { id: 'ambiente', name: 'Portable environmental sensor kit', kg: 3 },
]; // [S] illustrative carried masses, per astronaut; suit mass excluded.
export const ESSENTIALS = [
  { id: 'pressure', name: 'Pressure suit and leak check', why: 'The Martian atmosphere cannot sustain human breathing or body pressure.' },
  { id: 'oxygen', name: 'Oxygen supply and emergency backup', why: 'Breathing gas must last through the return, including an abort.' },
  { id: 'scrubber', name: 'CO₂ removal and ventilation', why: 'Oxygen alone is insufficient: exhaled carbon dioxide must be removed.' },
  { id: 'cooling', name: 'Cooling loop and drinking water', why: 'Work produces body heat even when the surrounding air is cold.' },
  { id: 'power', name: 'Suit battery and thermal control', why: 'Life support, pumps and communications require power.' },
  { id: 'comms', name: 'Radio, navigation and return plan', why: 'Maintain contact and a way back; Earth cannot provide immediate rescue.' },
  { id: 'monitor', name: 'Dosimeter and space-weather briefing', why: 'A historical average cannot warn of a solar particle event.' },
  { id: 'rescue', name: 'Accessible shelter and rescue procedure', why: 'A material choice alone does not establish a reachable storm shelter.' },
]; // [H] project readiness checklist informed by NASA spacesuit references.
export const SHELTERS = [
  { id: 'shell', name: 'Metal pressure habitat', material: 'Aluminum-alloy pressure shell',
    protection: 'Provides a structural pressure envelope in this concept. Radiation performance requires a separate shielding design.',
    tradeoff: 'Do not treat metal walls or a visor as a validated storm shelter.' },
  { id: 'polymer', name: 'Habitat with hydrogen-rich shielding', material: 'Pressure shell plus polyethylene / water shielding',
    protection: 'NASA studies hydrogen-rich materials for particle shielding. This is an added layer, not a replacement pressure vessel.',
    tradeoff: 'Thickness, mass, coverage and particle energy still need engineering validation.' },
  { id: 'regolith', name: 'Regolith-covered habitat', material: 'Pressure module with local regolith cover',
    protection: 'Local soil is a potential shielding resource around an engineered habitat.',
    tradeoff: 'Requires excavation, load-bearing design and construction verification. A printed wall alone is not certified protection.' },
]; // [H] concepts, no invented radiation/thermal ratings or dose reductions.
export const BUDGET_CATEGORIES = [
  { id: 'transport', name: 'Launch, transit and landing' },
  { id: 'habitat', name: 'Habitat, shielding and construction' },
  { id: 'support', name: 'Suits, life support and equipment' },
  { id: 'operations', name: 'Operations, return and contingency' },
];
export const HISTORICAL_LAUNCH_ROUNDED_MILLION = 4100; // [R] NASA OIG 2021 rounded published estimate.
export const HISTORICAL_LAUNCH_COST = [
  { name: 'SLS production', millionUSD: 2200 },
  { name: 'Orion capsule', millionUSD: 1000 },
  { name: 'ESA service module (barter value)', millionUSD: 300 },
  { name: 'Ground systems at annual launch cadence', millionUSD: 568 },
]; // [R] published OIG estimates, IG-22-003 (2021), pp. 22–23; not actual Mars expenditure.
export const SOURCE_LINKS = {
  suit: 'https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/',
  shielding: 'https://science.nasa.gov/resource/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/',
  budget: 'https://oig.nasa.gov/wp-content/uploads/2024/02/ig-22-003.pdf',
};
