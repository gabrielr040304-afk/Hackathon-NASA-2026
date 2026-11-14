// Camadas do Mars Trek (NASA/JPL) para Leaflet. Grade = L.CRS.EPSG4326; endereço {z}/{y}/{x}.
const TREK = 'https://trek.nasa.gov/tiles/Mars/EQ/';
const path = '/1.0.0/default/default028mm/{z}/{y}/{x}';

// zoom máximo lido do WMTSCapabilities.xml de cada camada (14/11/2026)
const BASES = [
  { name: 'Color (Viking)', url: TREK + 'Mars_Viking_MDIM21_ClrMosaic_global_232m' + path + '.jpg', z: 7,
    about: 'Viking orbiters color mosaic, 232 m per pixel. [R] NASA/USGS' },
  { name: 'Elevation (MOLA)', url: TREK + 'Mars_MGS_MOLA_ClrShade_merge_global_463m' + path + '.jpg', z: 7,
    about: 'Laser altimetry from Mars Global Surveyor: blue is low, red is high. [R] NASA/GSFC' },
  { name: 'Thermal, day (THEMIS)', url: TREK + 'THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018' + path + '.png', z: 9,
    about: 'Mars Odyssey daytime infrared: sunlit slopes look brighter. [R] NASA/JPL/ASU' },
  { name: 'Thermal, night (THEMIS)', url: TREK + 'THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018' + path + '.png', z: 9,
    about: 'Nighttime infrared: bare rock keeps heat and looks bright; fine dust cools and looks dark. [R] NASA/JPL/ASU' },
  { name: 'Geology (USGS)', url: 'https://trek.nasa.gov/mars/trekarcgis/rest/services/SIM3292_Global_Geology/MapServer/WMTS/tile/1.0.0/SIM3292_Global_Geology/default/default028mm/{z}/{y}/{x}.png', z: 11,
    about: 'Global geologic map (SIM 3292): each color is a rock unit of different age and origin. [R] USGS' },
];

const LOCAL = {
  hirise_jezero: { name: 'HiRISE detail (25 cm)', url: TREK + 'JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd' + path + '.png', z: 17,
    bounds: [[18.3068, 77.2229], [18.6693, 77.5840]], credit: 'NASA/JPL/University of Arizona' },
  hirise_gale: { name: 'HiRISE detail (Curiosity)', url: TREK + 'curiosity_hirise_mosaic' + path + '.png', z: 16,
    credit: 'NASA/JPL/University of Arizona' },
};

export function baseLayers(onError) {
  return BASES.map((b) => {
    const layer = L.tileLayer(b.url, { maxNativeZoom: b.z, maxZoom: 19, attribution: 'Mars Trek (NASA/JPL)' });
    layer.on('tileerror', onError);
    return { name: b.name, about: b.about, layer };
  });
}

export function localLayer(id) {
  const l = LOCAL[id];
  if (!l) return null;
  return {
    name: l.name,
    layer: L.tileLayer(l.url, { maxNativeZoom: l.z, maxZoom: 19, bounds: l.bounds, attribution: l.credit }),
  };
}
