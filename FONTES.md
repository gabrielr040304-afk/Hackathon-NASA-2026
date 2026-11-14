# Fontes dos dados e créditos

Etiquetas usadas na interface: **[R]** real (medido ou publicado pela NASA/USGS) · **[D]** derivado (calculado por nós a partir de dados reais) · **[S]** simulado (modelo nosso) · **[H]** hipotético (proposta nossa).

A lista completa e testada está na seção 4 do [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md). Este arquivo registra o que de fato entrou no projeto, com o processamento feito.

## Dados usados

| Dado | Etiqueta | Fonte | Processamento nosso |
|---|---|---|---|
| Relevo 3D de Jezero (`data/jezero/terrain.bin`) | R (alturas) / D (reamostragem) | USGS Mars 2020 TRN HiRISE DTM `JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m` | Recorte de 2 × 2 km centrado em 18,4975° N, 77,305° L; média em blocos de 1 m para ~3,9 m (512 × 512) — `tools/prep_terrain.py` |
| Textura 3D (`data/jezero/texture.jpg`) | R | Mosaico HiRISE de Jezero (25 cm) via Mars Trek, zoom 15 (~1,2 m/px) | Quadradinhos juntados e recortados no mesmo bbox, 2048 × 2048 — `tools/prep_texture.py` |
| Clima de Jezero (`data/weather/jezero.json`) | R | MEDA/Perseverance, feed `mars.nasa.gov/rss/api/?feed=weather&category=mars2020` (sóis 1130–1133, abr/2024) | Só sóis com temperatura e pressão medidas — `tools/prep_data.py` |
| Clima de Gale (`data/weather/gale.json`) | R | REMS/Curiosity (Centro de Astrobiología), feed `...category=msl`; uso para divulgação | Últimos 60 sóis válidos (inclui temperatura do solo e UV) — `tools/prep_data.py` |
| Trajetos dos rovers (`data/traverse/`) | R | `mars.nasa.gov/mmgis-maps/{M20,MSL}/Layers/json/*_traverse.json` | Sem alteração |
| Rotas de Jezero (`data/sites.json`) | R (pontos) / H (base) | Paradas do Perseverance, `M20_waypoints.json`, sóis 1142–1264 | Paradas a cada ~100 m, ida e volta pelo mesmo caminho; base num ponto com inclinação < 5° no relevo HiRISE |
| Rota de Gale (`data/sites.json`) | R (pontos) / H (base) | Paradas do Curiosity, `MSL_waypoints.json`, sóis 4580–4709 (campanha boxwork, blog do Curiosity: sóis 4627–4628 crista, 4709–4715 perfuração) | Paradas a cada ~100 m |
| Rota de Arcadia (`data/sites.json`) | H (rota) / R (altitudes) | Centro do mapa do estudo piloto SWIM em Arcadia, 196° L, 47,25° N (SWIM/PSI, LPSC 2019, resumo 2069); altitudes do MOLA 463 m (USGS) | Base e alvos hipotéticos a até 1,5 km do centro; altitudes lidas por leitura parcial do GeoTIFF — `tools/mola_elev.py` |
| Foto de Cheyava Falls (`data/photos/cheyava.jpg`) | R | NASA PIA26401 (Mastcam-Z), "Mastcam-Z Views the 'Cheyava Falls' Workspace" — NASA/JPL-Caltech/ASU/MSSS | Reduzida para 1200 px |
| Foto do leito do Neretva Vallis (`neretva.jpg`) | R | Perseverance, sol 1168, NLF_1168_0770638338_771ECM_N0525032NCAM02168_04_195J (NAVCAM_LEFT) — NASA/JPL-Caltech | Versão de 800 px da galeria bruta |
| Foto da encosta oeste (`encosta.jpg`) | R | Perseverance, sol 1264, NLF_1264_0779152935_617ECM_N0590330NCAM02264_01_195J (NAVCAM_LEFT) — NASA/JPL-Caltech | Versão de 800 px da galeria bruta |
| Foto da crista do boxwork (`crista.jpg`) | R | NASA PIA26559 (Mastcam), "Curiosity's First 360-Degree View of Boxwork Patterns" — NASA/JPL-Caltech/MSSS | Reduzida para 1200 px |
| Foto do vale Monte Grande (`montegrande.jpg`) | R | NASA PIA26695, "Curiosity Lights Up 'Nevado Sajama' at Night" — NASA/JPL-Caltech/MSSS | Reduzida para 1200 px |
| Textos dos alvos | R (fatos) | NASA/JPL: anúncio de Cheyava Falls (jul/2024) e da amostra Sapphire Canyon (set/2025); blog do Curiosity (sóis 4627–4628, 4709–4715) | Resumo nosso, em português |

## Créditos
- Imagens e dados de missões: NASA/JPL-Caltech.
- HiRISE: NASA/JPL/University of Arizona.
- Relevo e mosaicos Mars 2020 TRN e mapa geológico SIM 3292: USGS Astrogeology.
- Clima REMS (Curiosity): Centro de Astrobiología (CAB), dados para divulgação.
