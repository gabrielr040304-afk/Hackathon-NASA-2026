# Hackton-NASA-2026 — Guia de Sobrevivência em Marte

Survival HUD for astronauts on exploratory missions to Mars. Overlays data from NASA missions, such as terrain, weather, radiation and resources, onto the Martian map to plan routes and monitor Marswalks safely. Built for NASA Space Apps Challenge 2026: Interplanetary Survival Guide – Martian Map.

Planeje uma caminhada de astronauta em Marte com dados reais da NASA e execute-a num simulador 3D com visor no capacete.

## Como rodar
1. `npm run dev` (ou `python -m http.server 8000`, ou `php -S localhost:8000`)
2. Abra http://localhost:8000. Abrir o `index.html` com dois cliques não funciona, porque os módulos JS precisam de servidor.

## Como testar
`npm test` (usa o `node --test` embutido no Node 24, sem instalar nada)

Plano e divisão do trabalho: [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md) · Fontes dos dados: [FONTES.md](FONTES.md)
