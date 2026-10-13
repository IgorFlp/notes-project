---
mode: agent
description: "Gera o plano técnico (como) a partir de uma especificação existente."
argument-hint: "Informe o número ou o caminho da especificação"
---

Gere o **plano técnico** da feature indicada pelo usuário. O texto após o comando identifica a especificação pelo número ou pelo caminho.

## Instruções

- Localize a especificação correspondente em `specs/`. Se o usuário informar um caminho, use-o para localizar o arquivo; se informar um número, procure a especificação com esse número.
- Leia a especificação completa e [specs/constitution.md](../../specs/constitution.md) antes de elaborar o plano.
- Se não for possível identificar a especificação sem ambiguidade, ou se faltarem informações que impeçam um plano coerente, pergunte ao usuário e aguarde antes de criar ou finalizar o plano.
- Crie `plan.md` na mesma pasta da especificação.
- Não implemente a feature nem altere código. O plano deve descrever como implementar, sem executar a implementação.
- Baseie o plano na especificação e na constituição. Não invente requisitos nem decida silenciosamente questões que exijam revisão humana.
- Inclua riscos e pontos que precisam de decisão humana, destacando-os para revisão.

## Estrutura obrigatória do plano

Organize o documento com estes cinco tópicos numerados:

1. **Arquitetura:** camadas e arquivos a criar ou alterar, respeitando o fluxo HTTP/CLI → service → store e mantendo o domínio sem IO.
2. **Modelo de dados:** tipos do domínio e schemas Zod necessários, incluindo validações pertinentes nas fronteiras.
3. **Contratos:** rotas HTTP e/ou comandos CLI aplicáveis, com entradas e saídas esperadas. Se a especificação não exigir uma interface, registre isso sem inventar contratos.
4. **Decisões e trade-offs:** decisões técnicas necessárias, opções relevantes e consequências; identifique explicitamente o que requer decisão humana.
5. **Estratégia de testes:** cenários e camadas a cobrir com `node:test`, incluindo casos de sucesso, validação e erros previsíveis conforme aplicável.

Finalize com seções explícitas de **Riscos** e **Pontos para decisão humana**. Se não houver itens identificados em uma delas, declare isso.

Antes de concluir, confira a numeração das seções, a consistência com a especificação e a constituição, e confirme que somente o `plan.md` foi criado ou alterado.
