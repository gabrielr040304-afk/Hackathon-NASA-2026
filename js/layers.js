// Camadas do Mars Trek (NASA/JPL) para Leaflet. Grade = L.CRS.EPSG4326; endereço {z}/{y}/{x}.
const TREK = 'https://trek.nasa.gov/tiles/Mars/EQ/';
const path = '/1.0.0/default/default028mm/{z}/{y}/{x}';

// zoom máximo lido do WMTSCapabilities.xml de cada camada (14/11/2026)
const BASES = [
  { name: 'Cor (Viking)', url: TREK + 'Mars_Viking_MDIM21_ClrMosaic_global_232m' + path + '.jpg', z: 7,
    about: 'Mosaico colorido das sondas Viking, 232 m por pixel. [R] NASA/USGS' },
  { name: 'Relevo (MOLA)', url: TREK + 'Mars_MGS_MOLA_ClrShade_merge_global_463m' + path + '.jpg', z: 7,
    about: 'Altitude medida a laser pela Mars Global Surveyor: azul é baixo, vermelho é alto. [R] NASA/GSFC' },
  { name: 'Térmico de dia (THEMIS)', url: TREK + 'THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018' + path + '.png', z: 9,
    about: 'Infravermelho diurno da Mars Odyssey: encostas ao sol aparecem mais claras. [R] NASA/JPL/ASU' },
  { name: 'Térmico de noite (THEMIS)', url: TREK + 'THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018' + path + '.png', z: 9,
    about: 'Infravermelho noturno: rocha exposta guarda calor e fica clara; poeira fina esfria e fica escura. [R] NASA/JPL/ASU' },
  { name: 'Geologia (USGS)', url: 'https://trek.nasa.gov/mars/trekarcgis/rest/services/SIM3292_Global_Geology/MapServer/WMTS/tile/1.0.0/SIM3292_Global_Geology/default/default028mm/{z}/{y}/{x}.png', z: 11,
    about: 'Mapa geológico global (SIM 3292): cada cor é uma unidade de rocha de idade e origem diferentes. [R] USGS' },
];

const LOCAL = {
  hirise_jezero: { name: 'Detalhe HiRISE (25 cm)', url: TREK + 'JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd' + path + '.png', z: 17,
    bounds: [[18.3068, 77.2229], [18.6693, 77.5840]], credit: 'NASA/JPL/University of Arizona' },
  hirise_gale: { name: 'Detalhe HiRISE (Curiosity)', url: TREK + 'curiosity_hirise_mosaic' + path + '.png', z: 16,
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
