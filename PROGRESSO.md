# Progresso

## Estimativas por item autorizadas ? 14/11/2026
- Usuario autorizou estimativas [H] com busca de referencia real. Catalogo por item centralizado em config.js; referencias NASA Axiom/NextSTEP/Pandora e contrato de estudo LTV divulgado pela Intuitive Machines. Parcelas e multiplicadores sao hipoteses explicitas, nao precos unitarios NASA.
- Valores nas selecoes, subtotal de preparacao, revisao, relatorio e analise EVA. Contados uma vez por missao/equipe, sem multiplicacao automatica por tripulante. Escopos/exclusoes e referencias mostrados por item; formatacao M/B preservada.
- 42 testes aprovados; sintaxe conferida. Sem push.


## Precos e exposicao de radiacao ? 14/11/2026
- Removidos precos hipoteticos por item e total automatico de missao: nao havia base NASA para considera-los aproximacoes fieis. Mantida referencia historica OIG 2021 SLS/Orion (~$4.1B), com escopo, fonte e formatacao M/B. Precos desconhecidos nao viram zero.
- Novo painel nas duas crateras: dose acumulada de referencia, taxa historica e visibilidade do ceu conforme relevo/posicao. Obstrucao geometrica [D] nao altera dose nem promete protecao; bordas sem cobertura assinaladas. Sem dados locais inventados.
- 39 testes aprovados, incluindo limiar M/B, custos desconhecidos, planicie, vale e borda do relevo; sintaxe e contrato HUD verificados. Painel carregado no Chrome em Jezero (97,6% de ceu visivel na base), com transferencia da referencia Gale explicitada. Sem push.


## Finalizacao Gale e habitat ? 14/11/2026
- Gale 3D habilitado para Boxwork formations e Boxwork ridge - short, catalogo compartilhado entre planejador e simulador. HiRISE DTEEC_019698_1750_019988_1750_U01 recortado em 1,6 km, 512 x 512, sem lacunas; textura Mars Trek propria. Cache bruto fora do Git.
- Habitat refeito com modulo pressurizado, airlock, escotilha, apoios no terreno, escada, radiadores, paineis solares, antenas e itens conforme preparacao. Variantes de blindagem e rover conceituais [H]; inspecao explica fonte e escolhas.
- Rochas procedurais com detalhe, afloramentos ilustrativos, boxwork com fraturas/nodulos e referencia ao furo de Nevado Sajama. Pedras opcionais ao longo da trilha inspecionaveis com E e referencias NASA, sem fingir coordenadas individuais reais.
- Verificacao: 36 testes de modelo aprovados; todas as 15 combinacoes de rota/abrigo geraram geometrias validas no Three.js real. Chrome abriu Gale, HUD ativo e inspecao do habitat visualmente confirmados. Nao foi percorrido manualmente o trajeto inteiro. Contrato HTML/HUD corrigido.
- Fontes e limites atualizados no README/SOURCES; agua antiga distinguida de agua disponivel hoje. Diferenca de altitude DTM versus rover documentada (11?15 m). Sem push.


## Revisão de ciência e EVA — 14/11/2026
- Solicitação atual: objetivos filtrados por destino, alternativas de rota coerentes; Meridiani retirada das opções de EVA por falta de trajeto/relevo verificado (não por impossibilidade física ou inexistência de horário solar). Dados arquivados preservados.
- Gale: camada de pontos científicos com fontes, além do trajeto Curiosity e imagem orbital existentes; permanece sem 3D local.
- Jezero: orientação científica persistente com distância/rumo, minimapa com nomes, referências e ferramentas selecionadas por alvo; registrar investigação consome 30 minutos simulados uma única vez. Rochas instanciadas, habitat e rover ilustrativos [H]. Manifesto completo na pausa.
- EVA analysis reorganizada com tabela de recursos, diário científico e projeção separada, com vidro translúcido. HUD atualizado em intervalos; limite de pixel ratio. Sem alegar ganho de FPS medido.
- Corrigidos preços rotulados por equipe mas calculados por astronauta; conversão de duração SI para relógio marciano aplicada em planejador e simulador (NASA GISS).
- 31 testes aprovados com `node --test --test-isolation=none "tests/*.test.mjs"`; sintaxe e diff conferidos. `npm test` tambem aprovado (31 testes) apos execucao fora da restricao de subprocessos. Verificação visual tentada: browser host indisponível; acesso nativo falhou com janelas minimizadas. Pendente testar WebGL, controles e composição visual como usuário antes da apresentação. Sem push.

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

### Revis?o de categorias e investimento
- Prepara??o com oito essenciais e tr?s recomenda??es adicionais em categorias (conting?ncia/manuten??o e poeira). Cores desta etapa independem de pap?is da equipe definidos depois. Valores grandes em verde, total separado da contagem; custos extras inclu?dos na estimativa e relat?rio. Removidas fotos dos detalhes dos equipamentos. 21 testes aprovados; sintaxe e diff conferidos. Ferramenta de navegador ainda indispon?vel para inspe??o visual.

### Extras opcionais e cautelas no mapa
- Total financeiro movido para baixo das op??es e avisos de prepara??o. Extras opcionais de ci?ncia/arquivo entram no custo, sem alterar checklist recomendado. Jezero continua com duas rotas selecionadas. Nova camada com c?lulas de cautela derivadas do relevo real HiRISE: 782 c?lulas sinalizadas, 237 acima do limiar simulado de 25 graus, m?ximo amostrado ~48,3 graus. Fonte e limita??es nos popups; n?o ? mapa de radia??o. 23 testes aprovados. Navegador automatizado indispon?vel para inspe??o visual.

### Rotas curtas e fotos
- Duas alternativas hipot?ticas geradas a partir dos pontos existentes: canal Neretva em Jezero e crista boxwork em Gale. Fotos dos popups abrem em nova aba para amplia??o. Trajetos s?o propostas, n?o rotas certificadas para astronautas.

### Meridiani e cobertura de relevo
- Arcadia substitu?da por Meridiani / Eagle Crater. Coordenadas NASA; altitude MOLA grosseira consultada. Sem DEM local, trajeto Opportunity digitalizado ou clima, cen?rio hipot?tico ? bloqueado e resultados num?ricos n?o s?o apresentados. Grade de Jezero identifica declividade baixa/alta e aus?ncia de dados; Gale e Meridiani mostram ?rea ilustrativa cinza por falta de DEM local preparado. N?o classificar radia??o ou seguran?a real.

### Simulador Jezero
- TypeScript autorizado pelo usu?rio: main.ts/model.ts, gera??o JS via Node 24 sem depend?ncias. Um terreno HiRISE para as tr?s rotas; mouse/WASD, E alvos, M mapa, Esc pausa/relat?rio/proje??o. Prepara??o transferida via sessionStorage e conferida na entrada. HUD de recursos usa modelo existente; sem prever sobreviv?ncia real ou custo incremental inventado. Three.js CDN confirmado HTTP 200. 25 testes aprovados. Valida??o visual/WebGL n?o executada: browser access host unavailable. Conferir intera??o no navegador antes da demonstra??o.

### Route guidance repair
- Replaced sparse straight route line with a 1.2 m ribbon sampled every 2 m, interpolating rendered terrain triangles. Camera height uses rendered surface too. Animated view detections for terrain slope and science targets with view/terrain visibility checks; no fabricated directional radiation. 27 tests passed; measured triangle-center clearance positive on both full routes. Browser visual validation remains pending.
