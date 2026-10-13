---
mode: agent
description: "Cria a especificação do que e por que de uma feature, sem código."
argument-hint: "Descreva a feature a especificar"
---

Escreva uma **especificação** para a feature descrita pelo usuário.

## Regras

- Leia [specs/constitution.md](../../specs/constitution.md) e respeite todos os princípios.
- Não escreva código nem tome decisões de implementação. Especifique o que o sistema deve fazer e por que.
- Antes de criar o arquivo, verifique as especificações existentes em `specs/` e use o próximo número livre no formato `NNN`.
- Crie `specs/<NNN>-<slug>spec.md`, usando um slug curto, descritivo e em kebab-case.
- Organize o documento com exatamente estes tópicos, numerados de 1 a 6:
  1. Contexto e problema
  2. User Stories, no formato: “Com <papel>, quero <objetivo>, para <benefício>”.
  3. Requisitos funcionais, numerados sequencialmente como `RF-1`, `RF-2` e assim por diante.
  4. Critérios de aceite em EARS, formulados como: “Quando <evento>, o sistema deve <resposta>”.
  5. Fora de escopo
  6. Questões em aberto
- Verifique antes de concluir que a numeração dos tópicos está correta e que os requisitos funcionais estão sequenciais.
- Não invente requisitos nem responda por conta própria a questões em aberto.
- Se a descrição da feature estiver ausente ou houver ambiguidades que afetem o escopo ou o comportamento esperado, faça perguntas ao usuário e aguarde as respostas antes de criar ou finalizar a especificação.
