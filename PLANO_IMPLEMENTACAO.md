# Plano de implementação: Guia de Sobrevivência em Marte (planejador de caminhada + visor 3D)

> **Para agentes de IA:** use `superpowers:executing-plans` (ou `superpowers:subagent-driven-development`) para executar este plano tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`) para acompanhamento. Antes da Tarefa 1, rode a skill `setup-inicial` (veja a Tarefa 0).

**Objetivo:** um site em que o astronauta (1) responde a um questionário curto, escolhe um local de Marte e recebe uma caminhada planejada (rota, duração, consumo do traje, radiação e alertas de segurança), e (2) executa essa caminhada num simulador 3D em primeira pessoa, com um visor no capacete (HUD) que mostra sinais vitais e as condições do ambiente.

**Arquitetura:** site estático, com HTML, CSS e JavaScript puro e **sem servidor nem etapa de compilação**. O mapa usa Leaflet com as camadas oficiais do Mars Trek, e o 3D usa Three.js com o relevo real de 1 m da Cratera Jezero. Todos os cálculos ficam num único arquivo (`js/calc.js`), usado pelas duas telas. Os dados vêm da NASA e do USGS, preparados uma vez por scripts Python e salvos em `data/`.

**Tecnologias:** HTML/CSS/JS (módulos ES) · Leaflet 1.9.4 · Three.js 0.187.0 · Python 3 (só para preparar dados) · Node 24 (`node --test`, só para os testes) · GitHub Pages.

**Spec:** este próprio documento (as seções 1 a 9 são o design; a seção 10 em diante são as tarefas). Contexto científico: [Jezero_Contexto_Projeto.md](Jezero_Contexto_Projeto.md).

**Desafio:** [Interplanetary Survival Guide: Martian Map](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/), NASA Space Apps 2026. **Prazo: menos de 24 h.**

---

## Regras globais (valem para todas as tarefas)

- **Nada de servidor, banco de dados ou login.** O site precisa funcionar aberto pelo GitHub Pages.
- **Nada de etapa de compilação.** As bibliotecas entram por CDN com a versão fixa:
  - `https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js` e `.../leaflet.css`
  - `https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js` e `.../examples/jsm/controls/PointerLockControls.js`, ligados por `<script type="importmap">`.
- **Constantes do modelo ficam só em `js/config.js`.** Nenhum número mágico espalhado pelo código.
- **Todo valor mostrado na tela leva uma etiqueta de origem.** Isso segue o princípio de integridade do documento de contexto:

  | Etiqueta | Significado | Exemplo |
  |---|---|---|
  | **[R] Real** | medido ou publicado pela NASA/USGS | pressão do dia (MEDA), altitude (relevo HiRISE) |
  | **[D] Derivado** | calculado por nós a partir de dados reais | inclinação, distância, dose acumulada |
  | **[S] Simulado** | modelo nosso, sem dado da NASA | batimentos, oxigênio do traje |
  | **[H] Hipotético** | proposta nossa, não visitada | rota em Arcadia Planitia |

- **Não inventar valores locais de radiação.** A radiação é a média medida pelo Curiosity (RAD) em Gale e é sempre mostrada como "referência".
- **Coordenadas:** latitude e longitude em graus, longitude Leste de −180 a 180. A ordem no código é `{lat, lon}`.
- **Raio de Marte:** 3.396.190 m (esfera IAU Mars 2000, a mesma do relevo HiRISE).
- **Textos da interface em português.** Nomes de arquivos e funções sem acento.
- **Um commit a cada tarefa que funciona.** `git push` só com o "ok" do Gabriel.
- **Créditos visíveis:** "NASA/JPL-Caltech", "USGS" e "NASA/JPL/University of Arizona (HiRISE)", conforme o dado.

## Foco da revisão (casos que os testes das tarefas precisam cobrir)

1. **Rota longa demais para o traje:** o planejador mostra "NÃO RECOMENDADO" com o motivo. Nunca mostra porcentagem negativa ou `NaN` (teste na Tarefa 2).
2. **Dia de clima com campos vazios (`"--"`):** a NASA publica sóis sem medição. Esses sóis não aparecem na lista, e um local sem clima (Arcadia) não quebra nada (Tarefas 2 e 3).
3. **Jogador andando até a borda do terreno:** a posição é presa dentro do terreno, sem cair no vazio (Tarefa 7).
4. **`sim.html` aberto sem parâmetros**, por exemplo por um jurado que recebeu o link direto: usa a rota padrão de Jezero (Tarefa 7).
5. **Relevo com pixels sem dado** (valor `nodata` do GeoTIFF): o script preenche com os vizinhos e falha alto se sobrar algum (Tarefa 1).

---

## 1. Resumo em 1 minuto (para o time)

O desafio pede um mapa em camadas, com dados de várias missões da NASA, que ajude um astronauta a **planejar e executar uma caminhada em Marte** com segurança enquanto faz ciência. Ele sugere, entre outros formatos, um **HUD no visor do capacete**.

Nossa entrega tem duas telas ligadas por uma história só: **"planeje, depois execute"**.

1. **Planejador** (`index.html`): questionário em passos, no estilo do PureFlow, seguido do resultado no mapa com rota, números e alertas.
2. **Simulador** (`sim.html`): caminhada 3D em primeira pessoa **na Cratera Jezero**, seguindo a rota escolhida, com o visor mostrando tudo em tempo real.

O que nos diferencia:
- A rota de Jezero passa **por onde o Perseverance realmente andou**, ou seja, por terreno que já se provou transitável.
- O alvo principal é **Cheyava Falls**, a rocha com possíveis sinais de vida antiga encontrada em julho de 2024.
- O 3D usa o **relevo real de 1 metro** medido pelo satélite.

## 2. Escopo

**Entra:**
- Questionário com 5 passos e resultado com GO / NÃO RECOMENDADO.
- Três locais: **Jezero** (com 3D), **Gale/Monte Sharp** e **Arcadia Planitia** (só no planejador).
- Mapa com no mínimo 5 camadas de 4 tipos de dado (óptico, topográfico, térmico, geológico), mais trajeto do rover, clima e radiação nos painéis.
- Simulador 3D em Jezero, com uma área de 2 km × 2 km, visor completo e fotos reais do Perseverance nos alvos.

**Não entra (de propósito):**
- Cálculo automático de rota pelo relevo. As rotas são desenhadas por nós sobre dados reais. *Bônus se sobrar tempo.*
- Custo em dinheiro. O desafio não pede e não existe dado da NASA sobre isso.
- 3D de Gale e Arcadia.
- Celular no simulador: ele exige teclado e mouse e mostra um aviso no celular. O planejador funciona no celular.
- Rochas 3D individuais. O obstáculo representado é a **inclinação** do terreno, tirada do relevo real.

**Antiobjetivo:** apresentar como dado da NASA algo que inventamos. Isso derruba a credibilidade diante dos jurados, por isso existem as etiquetas R/D/S/H.

## 3. Como atendemos o desafio

| O desafio pede | Onde entregamos |
|---|---|
| Visão em camadas de um local ou rota | Mapa do planejador com as camadas do Mars Trek + modo "inclinação" no 3D |
| Dados de várias missões da NASA | MRO (HiRISE), Mars Odyssey (THEMIS), MGS (MOLA), Viking, Perseverance (MEDA, trajeto, fotos), Curiosity (RAD, REMS, trajeto), USGS (mapa geológico) |
| Pelo menos 3 tipos de dado | óptico, topográfico, térmico, geológico, atmosférico, radiação, posicional |
| Objetivo científico primeiro | O passo 1 do questionário é o objetivo; ele define o local e a rota |
| Segurança do astronauta | Alertas de inclinação, consumo, pôr do sol, astronauta sozinho e radiação |
| Mobilidade com traje e carga | Velocidade e esforço mudam com a inclinação e o peso carregado |
| Rota desviando de obstáculos | Rota por terreno já percorrido pelo rover + alerta e bloqueio por inclinação |
| Fotos do ponto de vista do solo | Fotos reais do Perseverance aparecem ao chegar em cada alvo |
| HUD no visor do capacete | Simulador 3D |
| Rover de apoio / dupla de astronautas | Opções no questionário, que mudam velocidade e alertas |

## 4. Fontes de dados (todas testadas em 14/11/2026)

| Dado | Etiqueta | Endereço | Uso |
|---|---|---|---|
| Mosaico colorido Viking (global, 232 m) | R | `https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg` | camada base |
| Relevo MOLA colorido (global, 463 m) | R | `https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg` | topografia |
| THEMIS infravermelho dia (100 m) | R | `https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png` | térmico |
| THEMIS infravermelho noite (100 m) | R | `.../THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png` | térmico (noite: rocha exposta × poeira) |
| Mapa geológico global USGS (SIM 3292) | R | `https://trek.nasa.gov/mars/trekarcgis/rest/services/SIM3292_Global_Geology/MapServer/WMTS/tile/1.0.0/SIM3292_Global_Geology/default/default028mm/{z}/{y}/{x}.png` | geologia |
| Mosaico HiRISE de Jezero (25 cm) | R | `https://trek.nasa.gov/tiles/Mars/EQ/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/1.0.0/default/default028mm/{z}/{y}/{x}.png` | camada local + textura do 3D |
| Mosaico HiRISE do Curiosity (Gale) | R | `https://trek.nasa.gov/tiles/Mars/EQ/curiosity_hirise_mosaic/1.0.0/default/default028mm/{z}/{y}/{x}.png` | camada local de Gale |
| Relevo HiRISE de Jezero (1 m, GeoTIFF 1,8 GB, float32, sem compressão, 1 linha por faixa, aceita leitura parcial) | R | `https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m_Eqc_latTs0_lon0_blend40.tif` | terreno 3D |
| Relevo CTX de Jezero (20 m, 9,6 MB) | R | `https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tif` | **plano B** do terreno |
| Trajeto e paradas do Perseverance (GeoJSON, até o sol 2022) | R | `https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json` e `.../M20_waypoints.json` | trajeto no mapa + pontos da rota (cada parada tem `lat`, `lon`, `elev_geoid`, `sol`) |
| Trajeto e paradas do Curiosity | R | `https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json` e `.../MSL_waypoints.json` | idem para Gale |
| Clima diário Jezero (MEDA) | R | `https://mars.nasa.gov/rss/api/?feed=weather&category=mars2020&feedtype=json&ver=1.0` | temperatura mín./máx., pressão, nascer/pôr do sol |
| Clima diário Gale (REMS) | R | `https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json&ver=1.0` | idem (o aviso do CAB diz "uso de divulgação": citar) |
| Fotos brutas do Perseverance | R | [galeria](https://mars.nasa.gov/mars2020/multimedia/raw-images/) e `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=...` | fotos nos alvos |
| Dose de radiação na superfície | R (em Gale) / referência (nos outros locais) | 0,64 mSv/dia, Curiosity RAD (Hassler et al., *Science* 343, 2014) | dose acumulada |
| Limite de carreira de radiação | R | 600 mSv (NASA-STD-3001) | dar contexto à dose |

**Como o mapa lê as camadas:**
- A grade das camadas é a mesma do `L.CRS.EPSG4326` do Leaflet: no zoom 0 são 2 × 1 quadradinhos de 256 px.
- O endereço usa a ordem `{z}/{y}/{x}`.
- Para converter coordenada em quadradinho no zoom `z`: `graus_por_quadradinho = 180 / 2^z`, `x = floor((lon + 180) / graus)`, `y = floor((90 − lat) / graus)`.
- O zoom máximo de cada camada está no `WMTSCapabilities.xml` dela (`.../1.0.0/WMTSCapabilities.xml`) e vai no `maxNativeZoom`.

## 5. Os três locais

| Local | Centro | Missão | Objetivo científico | Rota | 3D |
|---|---|---|---|---|---|
| **Cratera Jezero** | 18,4975° N, 77,305° L | Perseverance | Sinais de vida antiga (Cheyava Falls, julho de 2024) e sedimentos do antigo rio | Paradas reais do Perseverance entre os sóis 1150 e 1250, dentro da área 3D | Sim |
| **Gale / Monte Sharp** | definir pelas paradas do Curiosity de 2025 | Curiosity | Formações *boxwork* (exemplo citado no desafio) | Paradas reais do Curiosity na campanha de *boxwork* de 2025 | Não |
| **Arcadia Planitia** | escolher na região de gelo raso dos mapas SWIM (≈ 40–50° N) | nenhuma (pouco explorada) | Gelo de água para uma futura base humana | **[H]** hipotética, terreno plano | Não |

**Área do 3D (Jezero):** quadrado de 2 km × 2 km centrado em 18,4975° N, 77,305° L, ou seja, lon 77,287–77,323 e lat 18,478–18,512. A área está dentro da cobertura do relevo HiRISE (lon 77,22–77,58; lat 18,31–18,67). As paradas do Perseverance nos sóis 1204–1215 estão em 77,305° L, 18,4975° N, a cerca de −2.353 m.

## 6. Tecnologias escolhidas (skill escolha-de-stack)

| Camada | Escolha | Por quê | Alternativa considerada | O que se perde |
|---|---|---|---|---|
| Linguagem | JavaScript puro | O 3D no navegador exige JS de qualquer forma; os colegas são desenvolvedores web | PHP/Laravel (o que os colegas dominam) | Conforto dos colegas. Mas Laravel precisaria de servidor e não traz ganho: não há login, banco nem regra de servidor |
| Mapa | Leaflet 1.9.4 | Maduro, simples, aceita o sistema de quadradinhos do Mars Trek | OpenLayers | Nada relevante. OpenLayers é mais poderoso e mais complexo |
| 3D | Three.js 0.187.0 | O mais usado e o que a IA conhece melhor; roda no mesmo site | Godot/Unity | Física e controles prontos, mas ninguém do time conhece |
| Servidor e banco | nenhum | Todos os cálculos cabem no navegador | — | — |
| Hospedagem | GitHub Pages | Grátis; um link para os jurados | Netlify | Nada |
| Preparar dados | Python 3 (biblioteca padrão) + **Pillow 13.0.0** (só para juntar as imagens da textura) | Roda uma vez, não vai para o site | GDAL | GDAL é mais completo, mas difícil de instalar no Windows |
| Testes | `node --test` (embutido no Node 24) | Nenhum pacote a instalar | página de testes no navegador | Nada |

- **Custo mensal:** R$ 0.
- **Tecnologias novas para o time:** Leaflet e Three.js (2, dentro do limite de 3).
- **Verificado em 14/11/2026:**
  - versões no registro npm: Leaflet 1.9.4 (latest); Three.js 0.187.0 (publicado em 30/10/2026);
  - arquivos no CDN jsDelivr respondendo;
  - Pillow 13.0.0 no PyPI (Python ≥ 3.11);
  - Python 3.14.5, Node 24.15.0 e Git 2.54 instalados na máquina do Gabriel.
- **Para rodar localmente:** `python -m http.server 8000` ou, para quem tem PHP, `php -S localhost:8000`. Depois abrir `http://localhost:8000`. Abrir o arquivo com dois cliques não funciona, porque módulos JS exigem servidor.

## 7. Telas

**Planejador (`index.html`).** Um passo por vez, com cartões clicáveis. Cada opção tem uma nota curta de "por que importa", com a fonte, e isso forma o "questionário de informações importantes".

```
┌──────────────────────────────────────────────────────────┐
│  GUIA DE SOBREVIVÊNCIA EM MARTE          passo 2 de 5 ●●○○○│
│  Onde vamos caminhar?                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ JEZERO     │ │ GALE       │ │ ARCADIA    │              │
│  │ Perseverance│ │ Curiosity  │ │ sem rover  │              │
│  │ vida antiga│ │ boxwork    │ │ gelo p/base│              │
│  │ 🛰 3D disp. │ │ ☢ medida   │ │ [H] hipót. │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│  ⓘ Por que importa: ...                    [Voltar][Avançar]│
└──────────────────────────────────────────────────────────┘
```

Passos:
1. **Objetivo científico.** Opções: vida antiga, água e sedimentos, *boxwork*, gelo para base. A escolha sugere o local.
2. **Local.** Os 3 cartões.
3. **Equipe.** 1 ou 2 astronautas; rover de apoio, sim ou não.
4. **Carga.** Lista de equipamentos com peso (amostrador, câmera, perfuratriz, kit médico) que soma os kg, com ajuste de 0 a 40 kg.
5. **Data e hora.** Sol da lista de clima do local (Arcadia: "sem estação meteorológica") e hora de saída.

**Resultado:**

```
┌───────────────────────────────┬──────────────────────────┐
│  [mapa Leaflet]               │  ROTA: Cheyava Falls      │
│  camadas: ☑HiRISE ☐MOLA       │  4,2 km · ↑38 m · máx 9°  │
│  ☐THEMIS dia ☐noite ☐Geologia │  Duração 3h40 (D)         │
│  ☑Trajeto Perseverance        │  O₂ 52% · água 52% (S)    │
│  ● base  ○ alvos  ── rota     │  Bateria 46% (S)          │
│                               │  Radiação 0,10 mSv (ref.) │
│                               │  Volta 14:40 · pôr 17:11  │
│                               │  ✅ GO   ⚠ 1 aviso         │
│                               │  [▶ Simular no visor 3D]  │
└───────────────────────────────┴──────────────────────────┘
```

**Visor 3D (`sim.html`).** O terreno real fica ao fundo, e o HUD é desenhado em HTML/CSS por cima do 3D.

```
┌──────────────────────────────────────────────────────────┐
│        N ──┼── NE    ▶ Cheyava Falls  320 m   ⏱ EVA 01:12 │
│ VITAIS [S]                                AMBIENTE        │
│ ♥ 112 bpm                                 🌡 −41 °C [D]   │
│ SpO₂ 97%                                  ⏲ 774 Pa [R]    │
│ Temp 37,2 °C                              ☢ 0,03 mSv [D]  │
│ Traje 29,6 kPa                            ∠ 7° [D]        │
│                                           ⛰ −2.353 m [R]  │
│            ⚠ INCLINAÇÃO 18° — REDUZA A VELOCIDADE          │
│ O₂ ███████░░ 71%  ÁGUA ███████░░ 70%  BAT ████████░ 78%    │
│ [1] visão normal  [2] mapa de inclinação   [M] minimapa    │
└──────────────────────────────────────────────────────────┘
```

Ao chegar a menos de 15 m de um alvo, abre um painel com a **foto real do Perseverance** naquele ponto (crédito, sol e câmera) e o texto "o que observar".

## 8. Arquivos e contratos de dados (o que as partes trocam entre si)

```
/                         ← raiz do repositório = o que o GitHub Pages publica
├── index.html            planejador (questionário + resultado)
├── sim.html              simulador 3D + visor
├── css/planner.css, css/hud.css
├── js/config.js          constantes do modelo (único lugar)
├── js/calc.js            cálculos puros, usados pelas duas telas
├── js/planner.js, js/layers.js
├── js/sim/main.js, js/sim/terrain.js, js/sim/hud.js
├── data/sites.json
├── data/weather/jezero.json, gale.json
├── data/traverse/m20_traverse.json, msl_traverse.json
├── data/jezero/terrain.bin, terrain.json, texture.jpg
├── data/photos/          fotos escolhidas do Perseverance
├── tools/                scripts Python de preparo (tools/cache/ fica fora do Git)
├── tests/calc.test.mjs
├── FONTES.md, README.md, CLAUDE.md, PROGRESSO.md
└── Jezero_Contexto_Projeto.md, PLANO_IMPLEMENTACAO.md
```

**`data/sites.json`:** lista de locais.
```json
[{
  "id": "jezero", "name": "Cratera Jezero", "mission": "Perseverance (Mars 2020)",
  "center": {"lat": 18.4975, "lon": 77.305}, "zoom": 14,
  "objectives": ["vida-antiga", "sedimentos"],
  "weather": "data/weather/jezero.json",
  "traverse": "data/traverse/m20_traverse.json",
  "localLayer": "hirise_jezero",
  "hasSim": true,
  "habitat": {"lat": 0, "lon": 0, "elev_m": 0, "elev_source": "HiRISE DTM", "tag": "H"},
  "routes": [{
    "id": "cheyava-falls", "name": "Cheyava Falls", "objective": "vida-antiga", "tag": "R",
    "waypoints": [{
      "lat": 18.4975, "lon": 77.305, "elev_m": -2353.3, "elev_source": "M20_waypoints sol 1206",
      "target": {"name": "Cheyava Falls", "why": "texto curto", "photo": "data/photos/cheyava.jpg",
                 "credit": "NASA/JPL-Caltech", "sol": 1212, "camera": "MCZ_LEFT"}
    }]
  }]
}]
```
- A rota completa é `habitat → waypoints → habitat`, e quem monta isso é o `calc.js`.
- Um waypoint sem `target` é só um ponto de passagem.

**`data/weather/<site>.json`:** `[{ "sol": 1130, "terrestrial_date": "2024-04-24", "min_temp": -77.3, "max_temp": -14.0, "pressure": 774.0, "sunrise": "06:15:40", "sunset": "17:12:39" }]`. Só entram sóis com os três números preenchidos.

**`data/jezero/terrain.bin` + `terrain.json`:**
- `terrain.bin` são alturas em metros, `Float32` *little-endian*, linha por linha, com a linha 0 no norte.
- `terrain.json` = `{ "width": 512, "height": 512, "m_per_px_x": .., "m_per_px_y": .., "center_lat": 18.4975, "center_lon": 77.305, "bbox": [w, s, e, n], "elev_min": .., "elev_max": .., "source": "..", "source_url": ".." }`.
- `data/jezero/texture.jpg` (2048 × 2048) cobre exatamente o mesmo `bbox`.

**Parâmetros do simulador (endereço):** `sim.html?site=jezero&route=cheyava-falls&crew=2&rover=0&load=12&sol=1130&start=09:00`. Sem parâmetros, valem estes padrões: primeira rota de Jezero, crew 2, rover 0, load 10, primeiro sol da lista, 09:00.

**`js/config.js`:** todas as constantes, cada uma com etiqueta e fonte num comentário.

| Constante | Valor | Etiqueta / fonte |
|---|---|---|
| `MARS_RADIUS_M` | 3396190 | R: IAU Mars 2000 |
| `SUIT_CAPACITY_H` | 8 | S: ordem de grandeza das EVAs da NASA |
| `RESERVE_PCT` | 30 | S: reserva mínima ao voltar |
| `SUIT_SPEED_FACTOR` | 0.5 | S: o traje corta a velocidade a pé pela metade |
| `LOAD_FACTOR_PER_KG` | 0.01 | S: +1% de esforço por kg |
| `SLOPE_FACTOR_PER_DEG` | 0.03 | S: +3% de esforço por grau de subida |
| `ROVER_KMH` | 8 | S: inspirado no rover lunar da Apollo |
| `ROVER_MAX_SLOPE_DEG` | 15 | S |
| `SLOPE_WARN_DEG` | 15 | S |
| `SLOPE_NOGO_DEG` | 25 | S |
| `SCIENCE_MIN_PER_TARGET` | 30 | S |
| `RAD_MSV_PER_DAY` | 0.64 | R: Curiosity RAD, Hassler et al. 2014 |
| `CAREER_LIMIT_MSV` | 600 | R: NASA-STD-3001 |
| `DAYLIGHT_MARGIN_MIN` | 60 | S: voltar 1 h antes do pôr do sol |
| `SUIT_PRESSURE_KPA` | 29.6 | R: traje EMU da NASA (4,3 psi) |
| `HR_BASE_BPM` / `HR_PER_EFFORT` | 75 / 45 | S |
| `TIME_SCALE` | 30 | demonstração: 1 s real = 30 s simulados; a velocidade de caminhada no 3D também é multiplicada por 30 |
| `ARRIVAL_RADIUS_M` | 15 | — |

**`js/calc.js`:** funções puras, sem DOM, testáveis no Node.
- `distanceM(a, b) → number`: distância em metros entre `{lat, lon}` (haversine com `MARS_RADIUS_M`).
- `routeStats(points) → { distance_m, ascent_m, descent_m, max_slope_deg, segments: [{ distance_m, slope_deg }] }`: `points` são `{lat, lon, elev_m}`; a inclinação é com sinal (subida positiva).
- `effort(slopeDeg, loadKg) → number ≥ 1`: `1 + SLOPE_FACTOR_PER_DEG·max(0, slopeDeg) + LOAD_FACTOR_PER_KG·loadKg`. O simulador usa o mesmo cálculo.
- `walkSpeedKmh(slopeDeg, loadKg, rover) → number > 0`:
  - a pé: função de Tobler `6·exp(−3.5·|tan(slope) + 0.05|) · SUIT_SPEED_FACTOR / effort(0, loadKg)`;
  - com `rover` e |slope| ≤ `ROVER_MAX_SLOPE_DEG`: `ROVER_KMH`.
- `planEva(site, route, inputs, weatherSol) → plan`:
  - `inputs = { crew: 1|2, rover: boolean, loadKg: number, start: "HH:MM" }`; `weatherSol` é um item do clima ou `null`.
  - `plan = { stats, walk_h, science_h, total_h, used_pct: { o2, water, battery }, reserve_pct, dose_mSv, career_pct, end_time: "HH:MM", alerts: [{ level: "aviso"|"proibido", code, msg }], go }`.
  - `o2` e `water` usam `horas × effort / SUIT_CAPACITY_H × 100`, com o esforço de cada trecho; `battery` usa `total_h / SUIT_CAPACITY_H × 100`.
  - `reserve_pct = max(0, 100 − maior uso)`.
  - Códigos de alerta:
    - `solo` (aviso): "EVAs da NASA são feitas em dupla";
    - `inclinacao` (aviso acima de `SLOPE_WARN_DEG`, proibido acima de `SLOPE_NOGO_DEG`);
    - `consumivel` (proibido se `reserve_pct < RESERVE_PCT`);
    - `por-do-sol` (proibido se `end_time` > pôr do sol − `DAYLIGHT_MARGIN_MIN`);
    - `sem-clima` (aviso quando `weatherSol` é `null`; nesse caso não checa o pôr do sol);
    - `radiacao-ref` (aviso informativo, fora de Gale: "valor de referência medido em Gale").
  - `go = nenhum alerta "proibido"`.
- `airTempAt(weatherSol, hhmm) → number | null`: interpolação [D] entre a mínima (no nascer do sol) e a máxima (às 14:00).

**`js/sim/terrain.js`:** funções puras, sem Three.js.
- `parseTerrain(meta, arrayBuffer) → terrain`
- `lonLatToLocal(terrain, lat, lon) → { x, z }`: metros a partir do centro, `x` para Leste e `z` para o Sul (o Norte é −z).
- `heightAt(terrain, x, z) → number`: bilinear, com a posição presa dentro do terreno.
- `slopeAt(terrain, x, z) → number`: graus.

## 9. Quem faz o quê e quando

| Pessoa | Responsável por | Arquivos dela |
|---|---|---|
| **Claude (na sessão do Gabriel)** | Base do projeto, dados, cálculos e testes | `tools/`, `data/` (exceto fotos e textos), `js/config.js`, `js/calc.js`, `js/sim/terrain.js`, `tests/` |
| **Colega A** | Planejador (questionário + mapa + resultado) | `index.html`, `css/planner.css`, `js/planner.js`, `js/layers.js` |
| **Colega B** | Simulador 3D + visor | `sim.html`, `css/hud.css`, `js/sim/main.js`, `js/sim/hud.js` |
| **Gabriel** | Conteúdo científico, fotos, rotas de Gale/Arcadia, apresentação, entrega no Space Apps, testes como usuário | textos em `data/sites.json` (via Claude), `data/photos/`, `FONTES.md`, vídeo/slides |

Cada um mexe só nos próprios arquivos, para evitar conflito no Git. Quem precisar mudar `calc.js`, `config.js` ou `sites.json` pede ao Gabriel, e o Claude dele faz a mudança.

**Cronograma** (a hora 0 é quando começarem):

| Bloco | O quê | Marco |
|---|---|---|
| H0 – H1 | Tarefa 0 (base) e Tarefa 1 iniciada. Colegas leem este plano e as seções 7–8 | Repositório no GitHub, todos rodando `localhost:8000` |
| H1 – H6 | Em paralelo: Claude nas Tarefas 1–3; Colega A na Tarefa 5; Colega B na Tarefa 7; Gabriel na Tarefa 4 | — |
| **H6** | **Integração:** botão do planejador abre o 3D com a rota certa | Fluxo completo funcionando, ainda feio |
| H6 – H12 | Tarefas 6 e 8 (resultado, alertas, visor completo, fotos) | **H12: congelar funcionalidades.** Depois disso só correção e acabamento |
| H12 – H16 | Tarefa 9 (publicar), gravação do vídeo/slides, texto da entrega | Site no ar no GitHub Pages |
| Últimas 4 h | Folga para imprevistos. **Enviar no Space Apps pelo menos 2 h antes do prazo** | Entrega feita |

---

## 10. Tarefas

### Tarefa 0: base do projeto (Claude)

**Arquivos:** criar `.gitignore`, `CLAUDE.md`, `PROGRESSO.md`, `README.md`, `FONTES.md`, a estrutura de pastas da seção 8 e `index.html`/`sim.html` vazios com o título.

- [ ] **Passo 1:** rodar a skill `setup-inicial`, gravando no `CLAUDE.md` do projeto o stack aprovado da seção 6 e a regra "não trocar tecnologia sem aprovação".
- [ ] **Passo 2:** `.gitignore` com `tools/cache/` (os downloads grandes nunca vão para o Git), `__pycache__/` e `.env`.
- [ ] **Passo 3:** README com "como rodar" (`python -m http.server 8000` ou `php -S localhost:8000`) e "como testar" (`node --test tests/`).
- [ ] **Passo 4:** conferir que `http://localhost:8000` abre as duas páginas.
- [ ] **Passo 5:** commit `chore: base do projeto`. Criar o repositório no GitHub e fazer `git push` **só com o "ok" do Gabriel**. Convidar os colegas.

### Tarefa 1: terreno 3D de Jezero (Claude)

**Arquivos:** criar `tools/prep_terrain.py`, `tools/prep_texture.py`, `data/jezero/terrain.bin`, `terrain.json` e `texture.jpg`.
**Produz:** os arquivos do contrato `terrain.*` (seção 8).

- [ ] **Passo 1:** `prep_terrain.py`, só com a biblioteca padrão (`urllib`, `struct`):
  1. ler os primeiros 64 KB do GeoTIFF HiRISE (requisição HTTP `Range`) e as etiquetas `ModelPixelScale` (33550), `ModelTiepoint` (33922), `StripOffsets` (273) e `GDAL_NODATA` (42113);
  2. calcular as linhas e colunas da área da seção 5;
  3. baixar só essas linhas (com `Range`, cerca de 2.000 linhas × 2.000 colunas × 4 bytes ≈ 16 MB) para `tools/cache/`;
  4. reduzir para 512 × 512 pela média dos blocos.
  - A projeção é equiretangular com latitude padrão 0. Portanto `m_per_px_x = escala × cos(18,4975°)` e `m_per_px_y = escala`.
- [ ] **Passo 2:** autoverificação no fim do script, que falha com mensagem clara se algo estiver errado:
  - nenhum `nodata` restante (preencher com a média dos vizinhos válidos);
  - todas as alturas entre −3.000 e −1.500 m;
  - a altura no centro a menos de 30 m de −2.353 m (o valor do Perseverance no sol 1206).
- [ ] **Passo 3:** rodar `python tools/prep_terrain.py`. Esperado: imprime `OK`, a mínima, a máxima e o tamanho em metros (≈ 2.000 × 2.000).
- [ ] **Passo 4:** `prep_texture.py` (Pillow, conferido no PyPI: `pip install pillow==13.0.0`): baixar os quadradinhos do mosaico HiRISE de Jezero no zoom 15 que cobrem o `bbox` (cerca de 7 × 7), juntar, recortar exatamente no `bbox` e salvar `texture.jpg` em 2048 × 2048.
- [ ] **Passo 5:** abrir `texture.jpg` e conferir visualmente que mostra a região (comparar com o Mars Trek no mesmo ponto).
- [ ] **Plano B:** se a leitura parcial falhar, usar o relevo CTX de 20 m (9,6 MB, baixar inteiro), com o mesmo recorte e saída. Registrar em `FONTES.md`.
- [ ] **Passo 6:** commit `feat: terreno e textura de Jezero`.

### Tarefa 2: cálculos e testes (Claude)

**Arquivos:** criar `js/config.js`, `js/calc.js`, `js/sim/terrain.js` e `tests/calc.test.mjs`.
**Produz:** as funções da seção 8, com essas assinaturas exatas.

- [ ] **Passo 1:** escrever os testes primeiro (`node:test` + `node:assert`):
  - `distanceM` de (0,0) a (1,0): entre 59.274 e 59.276 m;
  - `routeStats` com 2 pontos na mesma altura: `max_slope_deg === 0` e `ascent_m === 0`;
  - `routeStats` com subida de 100 m em 1.000 m de distância horizontal: inclinação entre 5,6° e 5,8° e `ascent_m === 100`;
  - `walkSpeedKmh` diminui com a inclinação e é sempre > 0 de −40° a 40°;
  - `planEva` com `crew: 1`: tem o alerta `solo` e `go` continua `true`;
  - `planEva` com rota de 30 km a pé: alerta `consumivel` proibido, `go === false` e `reserve_pct >= 0`;
  - `planEva` com saída às 16:30 e pôr do sol às 17:11: alerta `por-do-sol` e `go === false`;
  - `planEva` com `weatherSol = null`: alerta `sem-clima` e **todos os campos numéricos passam em `Number.isFinite`** (nenhum `NaN`);
  - `heightAt` numa grade sintética 2 × 2 com alturas 0, 0, 10, 10: o centro vale 5, e um ponto fora da grade devolve o valor da borda.
- [ ] **Passo 2:** `node --test tests/`. Esperado: falha, porque as funções ainda não existem.
- [ ] **Passo 3:** implementar `config.js`, `calc.js` e `terrain.js` conforme a seção 8.
- [ ] **Passo 4:** `node --test tests/`. Esperado: todos passam.
- [ ] **Passo 5:** commit `feat: cálculos da caminhada com testes`.

### Tarefa 3: dados de clima, trajetos e locais (Claude + Gabriel)

**Arquivos:** criar `tools/prep_data.py`, `data/weather/jezero.json`, `data/weather/gale.json`, `data/traverse/m20_traverse.json`, `data/traverse/msl_traverse.json` e `data/sites.json`.

- [ ] **Passo 1:** `prep_data.py` baixa os dois climas, mantém só os sóis com `min_temp`, `max_temp` e `pressure` numéricos e salva no formato da seção 8. Também baixa os dois trajetos sem alterar nada.
- [ ] **Passo 2:** rodar o script. Esperado: imprime quantos sóis válidos cada local tem (> 0) e o tamanho dos trajetos.
- [ ] **Passo 3:** montar as rotas de Jezero a partir do `M20_waypoints.json`, usando só paradas dentro da área 3D:
  - rota 1 "Cheyava Falls" (vida antiga), passando pelas paradas dos sóis ≈ 1204–1215;
  - rota 2 com outro objetivo (sedimentos), com paradas vizinhas.
  - Escolher a **base** num ponto plano (inclinação < 5° no `terrain.bin`) a 1–2 km do primeiro alvo.
  - Cada rota totaliza entre 3 e 6 km ida e volta.
- [ ] **Passo 4:** rota de Gale pelo `MSL_waypoints.json`, nas paradas da campanha de *boxwork* de 2025, com a mesma regra de 3 a 6 km ida e volta. Confirmar os sóis numa notícia da NASA sobre *boxwork* e registrar a fonte em `FONTES.md`.
- [ ] **Passo 5:** rota de Arcadia: o Gabriel escolhe no mapa SWIM uma área de gelo raso, e os pontos são marcados `tag: "H"`. A altitude é lida no Mars Trek (ferramenta de elevação) e registrada em `elev_source`.
- [ ] **Passo 6:** teste extra em `tests/calc.test.mjs`, rodando `planEva` em **todas** as rotas do `sites.json` com entradas padrão: nenhum `NaN`, e as rotas de Jezero e Gale dão `go === true`.
- [ ] **Passo 7:** `node --test tests/` passando. Commit `feat: dados de clima, trajetos e rotas`.

### Tarefa 4: conteúdo científico e fotos (Gabriel, com o Claude ajudando)

**Arquivos:** campos `why` e `target` em `data/sites.json`, fotos em `data/photos/` e `FONTES.md`.

- [ ] **Passo 1:** para cada alvo, escrever de 2 a 3 frases de "o que observar e por que importa", com base no documento de contexto e em notícias da NASA.
- [ ] **Passo 2:** na [galeria do Perseverance](https://mars.nasa.gov/mars2020/multimedia/raw-images/), filtrar pelo sol de cada alvo de Jezero e escolher 1 foto por alvo (Mastcam-Z ou Navcam, de preferência paisagem). Salvar a foto em `data/photos/` com menos de 500 KB e registrar o ID da imagem, o sol, a câmera e o crédito "NASA/JPL-Caltech".
- [ ] **Passo 3:** textos das notas "por que importa" de cada opção do questionário (seção 7), com uma fonte por nota.
- [ ] **Passo 4:** `FONTES.md` com todas as fontes da seção 4, as etiquetas R/D/S/H e as limitações. Esse arquivo vira a seção de referências da entrega.
- [ ] **Passo 5:** commit `docs: conteúdo científico e fotos`.

### Tarefa 5: planejador, questionário e mapa (Colega A)

**Arquivos:** criar `index.html`, `css/planner.css`, `js/planner.js` e `js/layers.js`.
**Consome:** `data/sites.json`, `data/weather/*.json`, `data/traverse/*.json` e `planEva`/`routeStats` de `js/calc.js`.
**Enquanto a Tarefa 3 não chega:** usar um `sites.json` provisório com 1 rota de 3 pontos.

- [ ] **Passo 1:** `layers.js` exporta `baseLayers()` e `localLayer(id)`, que devolvem camadas `L.tileLayer` com os endereços da seção 4, `maxNativeZoom` lido do `WMTSCapabilities.xml` de cada camada e atribuição com o crédito. O mapa usa `crs: L.CRS.EPSG4326`.
- [ ] **Passo 2:** os 5 passos do questionário (seção 7), um por vez, com Voltar e Avançar. O estado fica num objeto `inputs` no formato de `planEva`.
- [ ] **Passo 3:** tela de resultado:
  - mapa centrado no local, com as camadas no `L.control.layers`;
  - trajeto do rover (GeoJSON), base, alvos e linha da rota;
  - painel com os números de `planEva`, cada um com a etiqueta R/D/S/H;
  - lista de alertas e selo GO / NÃO RECOMENDADO.
- [ ] **Passo 4:** botão "Simular no visor 3D", que monta o endereço da seção 8. Fica desativado quando `hasSim` é falso, com o aviso "simulação 3D disponível só para Jezero neste protótipo".
- [ ] **Passo 5:** verificação manual. Escolher Jezero, 2 astronautas, 10 kg, sol qualquer e saída 09:00: o resultado mostra GO, e a rota aparece sobre o mosaico HiRISE. Escolher 1 astronauta: aparece o aviso de dupla. Escolher saída 16:30: aparece NÃO RECOMENDADO (pôr do sol).
- [ ] **Passo 6:** commit `feat: planejador com questionário e mapa`.

### Tarefa 6: acabamento do planejador (Colega A)

- [ ] **Passo 1:** controle de transparência na camada superior (inspirado no NASA Worldview) e legenda das camadas.
- [ ] **Passo 2:** no celular, o questionário e o resultado empilham em uma coluna e não têm rolagem lateral.
- [ ] **Passo 3:** se as camadas do Mars Trek não carregarem, aparece a mensagem "camadas da NASA indisponíveis no momento", e a rota continua visível.
- [ ] **Passo 4:** commit `feat: acabamento do planejador`.

### Tarefa 7: simulador 3D (Colega B)

**Arquivos:** criar `sim.html` e `js/sim/main.js`.
**Consome:** `data/jezero/terrain.*` e `texture.jpg`, `parseTerrain`/`lonLatToLocal`/`heightAt`/`slopeAt` de `js/sim/terrain.js`, e `sites.json`.
**Enquanto a Tarefa 1 não chega:** gerar um `terrain.bin` provisório de 64 × 64 com ondulações.

- [ ] **Passo 1:** ler os parâmetros do endereço com `URLSearchParams`. Faltando algum, usar os padrões da seção 8.
- [ ] **Passo 2:** cena:
  - `PlaneGeometry` com `width − 1` por `height − 1` segmentos e a altura de cada vértice vinda do `terrain.bin` (escala real, sem exagero);
  - textura `texture.jpg`;
  - céu cor de caramelo e neblina leve;
  - luz do sol com a altura calculada pela hora simulada.
- [ ] **Passo 3:** controles: `PointerLockControls` com WASD e mouse.
  - A câmera fica 1,7 m acima de `heightAt`.
  - A velocidade é `walkSpeedKmh(inclinação, carga, rover) × TIME_SCALE`.
  - Inclinação acima de `SLOPE_NOGO_DEG` no sentido do movimento bloqueia o passo.
  - A posição fica presa dentro do terreno, com 5 m de margem.
- [ ] **Passo 4:** rota desenhada como uma linha alguns centímetros acima do chão, com uma coluna de luz em cada alvo. Ao chegar a menos de `ARRIVAL_RADIUS_M` do próximo alvo, ele passa a ser o seguinte.
- [ ] **Passo 5:** no celular ou sem teclado, aparece o aviso "use um computador com teclado e mouse".
- [ ] **Passo 6:** verificação manual. Abrir `sim.html` sem parâmetros: aparece o terreno de Jezero e dá para andar até o primeiro alvo. Andar até a borda: não cai. Subir uma encosta íngreme: o passo é bloqueado.
- [ ] **Passo 7:** commit `feat: simulador 3D de Jezero`.

### Tarefa 8: visor (HUD) (Colega B)

**Arquivos:** criar `js/sim/hud.js` e `css/hud.css`.
**Consome:** `effort`, `airTempAt` e as constantes de `config.js`, mais o clima do sol escolhido.

- [ ] **Passo 1:** `hud.js` exporta `createHud(rootEl)` → `{ update(state), showTarget(target), alert(code, msg) }`. O `state` é `{ simTimeMin, heading_deg, nextTarget, distToTarget_m, slope_deg, elev_m, used: { o2, water, battery }, hr, spo2, bodyTemp, airTemp, pressure, dose_mSv }`.
- [ ] **Passo 2:** em `main.js`, a cada quadro:
  - avançar o tempo simulado por `TIME_SCALE`;
  - consumir oxigênio e água por `effort` e a bateria pelo tempo;
  - `hr = HR_BASE_BPM + HR_PER_EFFORT × (effort − 1)` mais uma oscilação pequena;
  - SpO₂ em 97–99%;
  - temperatura corporal subindo 0,1 °C a cada 30 min de esforço alto;
  - dose `= RAD_MSV_PER_DAY × horas / 24`.
- [ ] **Passo 3:** layout da seção 7: bússola e próximo alvo no alto, vitais à esquerda, ambiente à direita, consumíveis embaixo, cada valor com a etiqueta R/D/S/H.
- [ ] **Passo 4:** alertas no centro:
  - inclinação acima de `SLOPE_WARN_DEG`;
  - reserva abaixo de `RESERVE_PCT + 10`: "INICIE O RETORNO";
  - menos de `DAYLIGHT_MARGIN_MIN` para o pôr do sol.
- [ ] **Passo 5:** tecla [2] colore o terreno pela inclinação (cores por vértice calculadas uma vez com `slopeAt`: verde < 10°, amarelo 10–20°, vermelho > 20°). Tecla [1] volta à textura.
- [ ] **Passo 6:** ao chegar num alvo, `showTarget` abre o painel com a foto, o crédito e o texto. Fecha com [E].
- [ ] **Passo 7:** verificação manual. Fazer a rota de Cheyava Falls inteira: a foto aparece em cada alvo, os consumíveis terminam perto do valor que o planejador previu (±10 pontos percentuais) e os alertas aparecem quando provocados.
- [ ] **Passo 8:** commit `feat: visor do astronauta`.
- [ ] **Bônus, só se sobrar tempo depois da H12, nesta ordem:**
  - minimapa no canto [M];
  - som de respiração acompanhando os batimentos;
  - rota calculada automaticamente (busca A* na grade de inclinação).

### Tarefa 9: publicar e entregar (Gabriel + Claude)

- [ ] **Passo 1:** com o "ok" do Gabriel: `git push` e ativar o GitHub Pages (Settings → Pages → branch `main`, pasta raiz).
- [ ] **Passo 2:** abrir o link publicado numa aba anônima e fazer o roteiro dos jurados: questionário, depois Jezero, GO e simulação até o primeiro alvo. Repetir com Gale e Arcadia (só no planejador). Conferir no celular que o planejador abre.
- [ ] **Passo 3:** conferir na página do Space Apps **os campos exatos da entrega e os critérios de avaliação**. Preparar:
  - resumo do projeto;
  - link do site e do repositório;
  - demonstração (vídeo curto ou slides, no formato pedido);
  - lista dos dados da NASA usados (vem de `FONTES.md`);
  - **declaração do uso de IA** (Claude), se o formulário pedir.
- [ ] **Passo 4:** roteiro do vídeo (≈ 30–60 s):
  1. o problema (mapas da NASA são globais, e a caminhada é local);
  2. o questionário;
  3. o resultado com alertas;
  4. a caminhada 3D chegando a Cheyava Falls com a foto real;
  5. as etiquetas R/D/S/H, que mostram honestidade com os dados.
- [ ] **Passo 5:** enviar **pelo menos 2 h antes do prazo**. Atualizar o `PROGRESSO.md`.

---

## 11. Riscos e plano B

| Risco | Plano B |
|---|---|
| A leitura parcial do relevo de 1 m falhar | Relevo CTX de 20 m, arquivo pequeno (Tarefa 1) |
| O Mars Trek sair do ar durante a apresentação | O 3D usa arquivos locais e não depende dele. No planejador, gravar o vídeo antes, com tudo carregado |
| O 3D não ficar pronto até a H12 | O visor (HUD) roda sobre uma foto panorâmica do Perseverance, sem caminhada, com os mesmos números animados |
| Conflito no Git entre os colegas | Cada um só mexe nos próprios arquivos (seção 9) |
| Atraso geral | Cortar nesta ordem: Arcadia → Tarefa 6 → modo de inclinação [2] → Gale |

## 12. Decisões que tomei (Gabriel, confira)

1. **Locais:** Jezero, Gale e Arcadia. Elysium Planitia ficou de fora: é plana e a ciência do InSight é subterrânea, rende menos numa caminhada.
2. **Área do 3D:** Cheyava Falls, a descoberta mais forte do Perseverance, e a rota segue o caminho real do rover.
3. **"Valor gasto"** virou consumo do traje (oxigênio, água, bateria). Dinheiro não tem dado da NASA nem é pedido no desafio.
4. **Modelo de esforço e consumo:** simplificado, com todos os números em `config.js` e marcados [S]. É uma demonstração, não uma previsão médica.
5. **Radiação:** a média do Curiosity é usada como referência em todos os locais, com essa ressalva na tela.
6. **Tempo acelerado ×30** no simulador, para que uma caminhada de 3 h dure cerca de 6 minutos na demonstração.
7. **Colegas em JavaScript, não em PHP:** sem servidor, o site fica mais simples de publicar e não há risco de ele cair durante a avaliação.
