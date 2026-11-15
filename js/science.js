// Curated science context. Coordinates remain the bundled rover stops, not rock surveys.
export const SCIENCE = {
  'Cheyava Falls': {
    focus: 'Potential biosignatures', kind: 'mudstone',
    evidence: 'Perseverance found organic compounds, pale veins and dark-rimmed spots in this sedimentary rock. The Sapphire Canyon sample contains potential biosignatures; life has not been confirmed.',
    look: 'Compare the pale veins and dark-rimmed spots in the rover photograph. Color or shape alone cannot establish a biological origin.',
    tools: ['camera', 'microscopia', 'espectrometro', 'amostrador'],
    source: 'https://www.jpl.nasa.gov/news/nasa-says-mars-rover-discovered-potential-biosignature-last-year/',
  },
  'Neretva Vallis channel floor': {
    focus: 'Ancient river sediments', kind: 'sediment',
    evidence: 'Neretva Vallis is a dry river valley that once carried water into Jezero. Sedimentary outcrops preserve evidence of that ancient environment.',
    look: 'Compare channel geometry, sediment textures and exposed outcrops with the rover image. This target does not locate drinkable water or an ice deposit.',
    tools: ['camera', 'amostrador', 'espectrometro'],
    source: 'https://www.nasa.gov/solar-system/nasas-perseverance-rover-scientists-find-intriguing-mars-rock/',
  },
  'West slope': {
    focus: 'Slope and rock-texture context', kind: 'outcrop',
    evidence: 'This stop uses a recorded Perseverance position and a rover photograph on the ascent toward the crater rim. Elevation comes from the bundled terrain model.',
    look: 'Compare surface texture and slope with the channel floor. Rock abundance has not been measured for this scene; the rendered fragments are illustrative.',
    tools: ['camera', 'microscopia', 'ambiente'],
    source: 'https://mars.nasa.gov/mars2020/multimedia/raw-images/',
  },
  'Boxwork ridge': {
    focus: 'Mineral-filled fractures', kind: 'ridge',
    evidence: 'Curiosity investigated resistant ridges associated with ancient groundwater. Mineral cement and subsequent erosion help explain the boxwork pattern.',
    look: 'Compare the ridge with the hollows between ridges. These are traces of ancient groundwater, not a present water supply.',
    tools: ['camera', 'espectrometro', 'microscopia'],
    source: 'https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-rover-sees-martian-spiderwebs-up-close/',
  },
  'Monte Grande hollow drill site': {
    focus: 'Ridge–hollow comparison', kind: 'sediment',
    evidence: 'The bundled Curiosity target records an investigation in a hollow between boxwork ridges. Use the rover photograph to compare exposed rock with surrounding loose material.',
    look: 'Compare this hollow with the ridge stop. A drill is an investigation tool; it does not guarantee access to water or evidence of life.',
    tools: ['camera', 'perfuratriz', 'amostrador'],
    source: 'https://science.nasa.gov/mission/msl-curiosity/',
  },
};

export const POSITION_NOTE = 'Marker anchored to a recorded rover stop [R]; target placement is approximate [H]. This is not a surveyed rock coordinate. Added rock shapes and their distribution are hypothetical [H].';
export function objectivesForSite(site, objectives) {
  return objectives.filter((objective) => site?.objectives.includes(objective.id));
}
export function scienceFor(target) { return SCIENCE[target.name]; }
export function investigationTools(target, selected) {
  return (scienceFor(target)?.tools ?? []).filter((id) => selected.includes(id));
}
