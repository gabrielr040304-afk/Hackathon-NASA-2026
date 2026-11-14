# ADR-001: Site estático em JavaScript puro, Leaflet e Three.js, no GitHub Pages
- Status: Aceita
- Data: 2026-11-14

## Contexto
Hackathon com menos de 24 h. Time de 3 pessoas: Gabriel, que não programa, e dois colegas que trabalham com PHP/Laravel. O produto tem duas telas: um planejador com mapa e um simulador 3D. Não há login, banco de dados nem regra que exija servidor. Os jurados precisam abrir o projeto por um link.

## Opções consideradas
- **A. Site estático (HTML/CSS/JS) + Leaflet + Three.js, no GitHub Pages.** Prós: sem servidor, publicação grátis em minutos, um link só. Contra: os colegas trabalham em JS, não em PHP.
- **B. Laravel no planejador + Three.js no 3D.** Prós: os colegas ficam no PHP. Contras: precisa de um servidor PHP hospedado, o que custa horas e traz risco de queda na avaliação, sem nenhum ganho funcional.
- **C. Godot/Unity no 3D.** Prós: física e controles prontos. Contra: ninguém do time conhece.

## Decisão
Opção A. Leaflet 1.9.4 e Three.js 0.187.0 via CDN jsDelivr com versão fixa, sem etapa de build. Python 3 (biblioteca padrão) + Pillow 13.0.0 só para preparar os dados. Testes com `node --test`.

## Consequências
- Melhora: publicar é só fazer `git push`, e cada colega trabalha em arquivos separados.
- Piora: os colegas saem da linguagem principal deles.
- Acompanhar: o desempenho do 3D em máquinas fracas (terreno de 512 × 512 vértices).
