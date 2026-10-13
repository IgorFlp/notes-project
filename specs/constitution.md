# Constitution - Notas API

Princípios não negociáveis que toda especificação, plano, tarefa e código devem seguir.

1. **Camadas explícitas:** as dependências fluem de HTTP/CLI para service e, em seguida, para store. O domínio não realiza operações de entrada/saída (IO).
2. **Validações na fronteira:** toda entrada externa é validada com Zod antes de se tornar parte do domínio.
3. **Erros são de domínio:** falhas previsíveis são representadas por classes de erro e traduzidas em status ou saída na borda.
4. **Teste é parte da tarefa:** nenhuma lógica é adicionada sem teste. O typecheck e os testes devem permanecer verdes.
5. **Segurança por padrão:** não incluir segredos no repositório. Ações destrutivas passam por guardrails (deny list + pre-commit), não pela confiança no modelo.
6. **Spec antes de código:** mudanças relevantes seguem o fluxo spec > plan > task > implement, com revisão humana entre as fases.
7. **Pequeno e reversível:** cada tarefa deve caber em um commit.

## Stack

Node.js 22, TypeScript ESM em modo strict, Zod, `node:test` via `tsx` e `node:http`.
