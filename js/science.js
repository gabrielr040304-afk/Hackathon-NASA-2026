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
    focus: 'Ridge–hollow comparison', kind: 'drill',
    evidence: 'Curiosity drilled the Nevado Sajama rock during the Monte Grande hollow campaign to investigate bedrock between boxwork ridges. This marker uses the nearby bundled rover stop; the drill hole is an illustrative reconstruction, not a surveyed hole coordinate.',
    look: 'Compare this hollow with the ridge stop. A drill is an investigation tool; it does not guarantee access to water or evidence of life.',
    tools: ['camera', 'perfuratriz', 'amostrador'],
    source: 'https://science.nasa.gov/blog/curiosity-blog-sols-4716-4722-drilling-success-at-nevado-sajama/',
  },
};

export const POSITION_NOTE = 'Marker anchored to a recorded rover stop [R]; target placement is approximate [H]. This is not a surveyed rock coordinate. Added rock shapes and their distribution are hypothetical [H].';
export function objectivesForSite(site, objectives) {
  return objectives.filter((objective) => site?.objectives.includes(objective.id));
}
export function scienceFor(target) { return target.science ?? SCIENCE[target.name]; }
export function investigationTools(target, selected) {
  return (scienceFor(target)?.tools ?? []).filter((id) => selected.includes(id));
}

export const FIELD_GUIDE = {
  gale: {
    name: 'Boxwork field specimen', focus: 'Fractures, mineral cement and nodules', kind: 'ridge',
    evidence: 'Curiosity documented resistant ridges, sand-filled hollows and nodules in the boxwork region. Minerals deposited by ancient groundwater helped harden parts of the rock. This rendered specimen represents that regional context; it is not a uniquely mapped NASA rock.',
    look: 'Inspect the raised, intersecting ribs and the small nodules. These forms illustrate mineral alteration and erosion. No present liquid water is shown or inferred.',
    tools: ['camera','microscopia','espectrometro'],
    source: 'https://science.nasa.gov/photojournal/curiosity-studies-nodules-on-boxwork-formations/',
    photo: 'data/photos/crista.jpg', credit: 'NASA/JPL-Caltech/MSSS; regional rover reference, not this reconstructed specimen',
  },
  jezero: {
    name: 'Neretva sedimentary field specimen', focus: 'Sedimentary texture and pale veins', kind: 'sediment',
    evidence: 'Perseverance investigated sedimentary outcrops in the ancient Neretva river valley. Cheyava Falls contains pale calcium-sulfate veins and organic compounds. This illustrative rock along the route is not an additional documented Cheyava Falls discovery.',
    look: 'Compare the layered surface with the pale vein material. Such features motivate imaging and mineral analysis; they do not establish life or a usable water supply.',
    tools: ['camera','microscopia','amostrador','espectrometro'],
    source: 'https://www.nasa.gov/solar-system/nasas-perseverance-rover-scientists-find-intriguing-mars-rock/',
    photo: 'data/photos/neretva.jpg', credit: 'NASA/JPL-Caltech; regional rover reference, not this reconstructed specimen',
  },
};
