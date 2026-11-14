# Fontes dos dados e créditos

Etiquetas usadas na interface: **[R]** real (medido ou publicado pela NASA/USGS) · **[D]** derivado (calculado por nós a partir de dados reais) · **[S]** simulado (modelo nosso) · **[H]** hipotético (proposta nossa).

A lista completa e testada está na seção 4 do [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md). Este arquivo registra o que de fato entrou no projeto, com o processamento feito.

## Dados usados

| Dado | Etiqueta | Fonte | Processamento nosso |
|---|---|---|---|
| Relevo 3D de Jezero (`data/jezero/terrain.bin`) | R (alturas) / D (reamostragem) | USGS Mars 2020 TRN HiRISE DTM `JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m` | Recorte de 2 × 2 km centrado em 18,4975° N, 77,305° L; média em blocos de 1 m para ~3,9 m (512 × 512) — `tools/prep_terrain.py` |
| Textura 3D (`data/jezero/texture.jpg`) | R | Mosaico HiRISE de Jezero (25 cm) via Mars Trek, zoom 15 (~1,2 m/px) | Quadradinhos juntados e recortados no mesmo bbox, 2048 × 2048 — `tools/prep_texture.py` |
| _(demais: Tarefas 3 e 4)_ | | | |

## Créditos
- Imagens e dados de missões: NASA/JPL-Caltech.
- HiRISE: NASA/JPL/University of Arizona.
- Relevo e mosaicos Mars 2020 TRN e mapa geológico SIM 3292: USGS Astrogeology.
- Clima REMS (Curiosity): Centro de Astrobiología (CAB), dados para divulgação.
