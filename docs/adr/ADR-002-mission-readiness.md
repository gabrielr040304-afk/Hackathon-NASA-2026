# ADR-002: Planejamento de recursos, proteção, riscos e contexto de custos

Em 14/11/2026, Gabriel autorizou ampliar `js/config.js` e confirmou Marte, apesar da menção inicial à Lua. A solicitação posterior amplia o escopo do plano para incluir contexto financeiro e estrutura de abrigo, mantendo a stack estática.

O planejador agora exige confirmações hipotéticas de suporte de vida e acrescenta conceitos qualitativos de abrigo. Não atribuímos notas de radiação, massa de construção ou desconto de dose a nomes de materiais. A seleção é explicada no relatório, sem alterar a exposição durante a caminhada.

`js/mission.js` aplica verificações adicionais ao resultado puro de `calc.js`: itens essenciais ausentes, partida antes do nascer do sol, falta de clima local e rota hipotética impedem MODEL GO. O contrato do simulador é preservado. A recomendação compara bloqueios, inclinação máxima amostrada, duração e reserva; não declara uma rota absolutamente segura.

Valores de orçamento são inseridos pelo usuário e marcados H. Valores desconhecidos não viram zero. O gráfico histórico mostra estimativas publicadas no relatório NASA OIG IG-22-003 de 2021, sem extrapolá-las para um preço real de missão humana a Marte. Fontes completas em SOURCES.md.

Limitações explícitas: sem previsão meteorológica atual, alerta de evento solar, mapa local de dose, cobertura de comunicação ou certificação de resgate. Dados de clima e trajeto podem representar datas diferentes. Não há IA ao vivo; recomendações são regras transparentes desenvolvidas com auxílio de IA.
