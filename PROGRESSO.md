# Progresso

## Próximo passo
- **Planejador (Tarefas 5 e 6): pronto**, feito pelo Claude e testado no navegador. Falta o commit do Gabriel.
- **Colega B:** Tarefa 7 (simulador 3D). Terreno real pronto em `data/jezero/`, com funções de altura e inclinação em `js/sim/terrain.js`.
- **Conteúdo (Tarefa 4): pronto.** 5 fotos reais com créditos, textos dos alvos e Arcadia no centro do estudo SWIM com altitudes MOLA.

## Pendências e avisos
- Repositório: https://github.com/gabrielr040304-afk/Hackton-NASA-2026 · Site: https://gabrielr040304-afk.github.io/Hackton-NASA-2026/ (GitHub Pages, branch main). Push só com o "ok" do Gabriel.
- **Entrega:** textos prontos em `docs/ENTREGA_SPACE_APPS.md` (inglês). Prazo: **domingo 15/11, 23:59** no horário do evento local. Falta: gravar o vídeo de até 30 s (ou 7 slides), colar os textos e clicar em Submit for Judging.
- **Regra do Space Apps:** tudo que os jurados veem precisa estar em inglês. O 3D (colega) também precisa sair em inglês.

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
- Planejador: questionário em 5 passos, mapa com 5 camadas do Mars Trek + detalhe HiRISE + trajeto do rover, painel com GO/NÃO RECOMENDADO e etiquetas R/D/S/H, transparência, legenda, aviso de camada fora do ar e layout de celular.
- Site traduzido para o inglês, SOURCES.md, declaração de uso de IA e textos da entrega prontos.
