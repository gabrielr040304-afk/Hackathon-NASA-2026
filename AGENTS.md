# Guia de Sobrevivência em Marte (NASA Space Apps 2026)

Site estático para planejar uma caminhada de astronauta em Marte (questionário + mapa em camadas)
e executá-la num simulador 3D em primeira pessoa com visor (HUD). Desafio: "Interplanetary
Survival Guide: Martian Map". Prazo: hackathon de menos de 24 h.

- Plano aprovado (é a especificação): @PLANO_IMPLEMENTACAO.md
- Contexto científico e regras de integridade dos dados: @Jezero_Contexto_Projeto.md

## Stack aprovado (não trocar sem aprovação do Gabriel)
- Linguagem: JavaScript puro (módulos ES), HTML e CSS. Sem framework, sem etapa de build.
- Mapa: Leaflet 1.9.4 via CDN jsDelivr.
- 3D: Three.js 0.187.0 via CDN jsDelivr (importmap).
- Backend, banco, login, pagamentos: nenhum.
- Hospedagem: GitHub Pages (branch `main`, pasta raiz).
- Preparo de dados: Python 3 (biblioteca padrão) + Pillow 13.0.0 só em `tools/prep_texture.py`.
- Testes: `node --test` (Node 24, sem pacotes).
- Decisões detalhadas: docs/adr/

## Comandos
- Rodar: `npm run dev` (= `python -m http.server 8000`) e abrir http://localhost:8000
  - Sem Python: `php -S localhost:8000`
- Testes: `npm test` (= `node --test tests/`)

## Regras do projeto
- Toda constante do modelo fica em `js/config.js`. Nada de números mágicos espalhados.
- `js/calc.js` e `js/sim/terrain.js` são puros (sem DOM, sem Three.js) e têm testes.
- Todo valor mostrado na tela leva etiqueta de origem: [R] real, [D] derivado, [S] simulado, [H] hipotético.
- Nunca apresentar como dado da NASA algo calculado ou inventado por nós.
- Cada pessoa mexe só nos próprios arquivos (seção 9 do plano). Mudanças em `calc.js`,
  `config.js` ou `data/sites.json` passam pelo Gabriel.
- Downloads grandes ficam em `tools/cache/` (fora do Git).
- Antes de instalar qualquer pacote, confira se ele existe no registro oficial.

## Rotina de sessão
Ao começar:
1. Leia `PROGRESSO.md` e `git log --oneline -10`.
2. Rode o projeto e os testes antes de mexer em algo novo.

Ao terminar:
- Rode `npm test` e teste no navegador como um usuário testaria.
- Commit por tarefa que funciona, com mensagem clara. `git push` só com o "ok" do Gabriel.
- Atualize `PROGRESSO.md`.

## Fora do escopo agora
- Cálculo automático de rota (só bônus), custo em dinheiro, 3D de Gale/Arcadia, celular no simulador.
