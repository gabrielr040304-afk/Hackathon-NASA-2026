# Progresso

## Próximo passo
- **Ampliação autorizada pelo Gabriel (14/11): implementada localmente.** Planejamento de Marte com 8 etapas, suporte de vida, conceitos de abrigo/proteção, orçamento hipotético e contexto histórico NASA OIG; relatório para download e comparação de rotas.
- **Validação visual pendente:** ferramenta de navegador retornou `The browser access host is unavailable`. Servidor local responde HTTP 200; não foi possível percorrer a interface visualmente nesta sessão. Conferir desktop/celular, alteração de rota, NO-GO por item essencial e download do resumo antes da apresentação.
- **Planejador (Tarefas 5 e 6): pronto**, feito pelo Claude e testado no navegador. Falta o commit do Gabriel.
- **Colega B:** Tarefa 7 (simulador 3D). Terreno real pronto em `data/jezero/`, com funções de altura e inclinação em `js/sim/terrain.js`.
- **Conteúdo (Tarefa 4): pronto.** 5 fotos reais com créditos, textos dos alvos e Arcadia no centro do estudo SWIM com altitudes MOLA.

## Pendências e avisos
- Repositório: https://github.com/gabrielr040304-afk/Hackton-NASA-2026 · Site: https://gabrielr040304-afk.github.io/Hackton-NASA-2026/ (GitHub Pages, branch main). Push só com o "ok" do Gabriel.
- **Entrega:** textos prontos em `docs/ENTREGA_SPACE_APPS.md` (inglês). Prazo: **domingo 15/11, 23:59** no horário do evento local. Falta: gravar o vídeo de até 30 s (ou 7 slides), colar os textos e clicar em Submit for Judging.
- **Regra do Space Apps:** tudo que os jurados veem precisa estar em inglês. O 3D (colega) também precisa sair em inglês.

## Histórico
### 2026-11-14
- Ampliação do planejador via Codex, autorizada pelo Gabriel: mantido Marte e stack; `config.js` centraliza catálogos, materiais e referências financeiras. `js/mission.js` acrescenta regras puras sem mudar o contrato do simulador. Checklist ausente, partida antes do nascer do sol, rota hipotética ou falta de clima bloqueiam MODEL GO. Marcadores de inclinação entre pontos da rota, comparação fundamentada de candidatos, janela de luz do dia, riscos não modelados e relatório em texto. Sem inventar zonas de radiação, notas de blindagem ou preços de missão marciana; custos reais publicados são identificados como estimativas históricas do SLS/Orion (OIG 2021), separados do orçamento H do usuário. Documentação em ADR-002 e SOURCES.md.
- Verificação: `npm test` aprovado (20 testes), após permitir execução fora da restrição de criação de processos; alternativa `node --test --test-isolation=none "tests/*.test.mjs"` também aprovada. Sintaxe JS conferida. A inspeção mecânica de design apontou bordas antigas, reduzidas para 1 px. Navegador indisponível para inspeção visual; nenhuma publicação/push executada.
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

### Revis?o de prepara??o e evid?ncias
- Aviso inicial oculto at? escolha do destino. Indicadores vermelho/amarelo/verde descrevem somente checklist hipot?tico; atualizados a cada sele??o. Detalhes expans?veis, ferramentas adicionais, capacidades da equipe, divis?o de transporte e custo por viajante. Evid?ncia hist?rica de blindagem em Murray Buttes com fonte NASA; sem inventar zonas radioativas. 21 testes aprovados; valida??o visual ainda depende do navegador automatizado.
