// Todas as constantes do modelo. Etiqueta: [R] real · [D] derivado · [S] simulado (suposição nossa).
export const MARS_RADIUS_M = 3396190;        // [R] esfera IAU Mars 2000 (mesma do relevo HiRISE)
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
export const ARRIVAL_RADIUS_M = 15;
export const PEAK_TEMP_HOUR = 14;            // [S] hora da temperatura máxima do dia
export const RADIATION_EVIDENCE_URL = 'https://www.nasa.gov/missions/mars-science-laboratory/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/';
// Illustrative mission costing assumptions, millions USD [H], not NASA quotations.
export const COST_MODEL = {
  essentials: { pressure: 100, oxygen: 25, scrubber: 30, cooling: 20, power: 25, comms: 35, monitor: 10, rescue: 80 },
  equipment: { amostrador: 3, camera: 2, espectrometro: 8, perfuratriz: 15, medico: 2, microscopia: 4, ambiente: 6 },
  shelter: { shell: 480, polymer: 620, regolith: 900 },
  rover: 250, operations: 493, contingency: 0.2,
};

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
