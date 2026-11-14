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
| Rota de Arcadia (`data/sites.json`) | H | **PROVISÓRIA**: centro IAU de Arcadia Planitia (47,2° N, 184,3° L) | Trocar pela área de gelo raso dos mapas SWIM e ler as altitudes no Mars Trek |
| _(fotos e textos: Tarefa 4)_ | | | |

## Créditos
- Imagens e dados de missões: NASA/JPL-Caltech.
- HiRISE: NASA/JPL/University of Arizona.
- Relevo e mosaicos Mars 2020 TRN e mapa geológico SIM 3292: USGS Astrogeology.
- Clima REMS (Curiosity): Centro de Astrobiología (CAB), dados para divulgação.
