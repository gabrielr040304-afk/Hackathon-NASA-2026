# Progresso

## Próximo passo
- **Colega A:** Tarefa 5 (planejador). Os dados reais já estão em `data/` e os cálculos em `js/calc.js`.
- **Colega B:** Tarefa 7 (simulador 3D). Terreno real pronto em `data/jezero/`, com funções de altura e inclinação em `js/sim/terrain.js`.
- **Gabriel:** Tarefa 4 (fotos do Perseverance e textos dos alvos, hoje marcados "PROVISÓRIO" em `data/sites.json`) e Tarefa 3, passo 5 (escolher a área de Arcadia no mapa SWIM).

## Pendências e avisos
- Repositório: https://github.com/gabrielr040304-afk/guia-sobrevivencia-marte · Site: https://gabrielr040304-afk.github.io/guia-sobrevivencia-marte/ (GitHub Pages, branch main). Push só com o "ok" do Gabriel.
- Arcadia Planitia está **provisória** (centro IAU, altitudes "PENDENTE").
- Conferir na página do Space Apps os campos da entrega e os critérios de avaliação (Tarefa 9).

## Histórico
### 2026-11-14
- Feito: plano aprovado; Tarefas 0–3 concluídas.
  - Base do projeto.
  - Terreno 3D de Jezero: relevo HiRISE de 1 m, 2 × 2 km, conferido contra a altitude do Perseverance.
  - Cálculos com 14 testes.
  - Clima, trajetos e rotas reais dos rovers.
- Problemas encontrados:
  - `node --test tests/` não funciona no Node 24; o comando passou a ser `npm test`.
  - Linhas retas entre paradas distantes cruzavam encostas de 31°; as rotas agora seguem as paradas do rover.
