# Instruções do projeto

## Stack
- Node.js 22 LTS; TypeScript ESM com `strict`.
- Zod valida entradas nas fronteiras HTTP e CLI.
- Testes com `node:test`, executados via `tsx`.
- Sem framework HTTP: usar `node:http` intencionalmente.

## Comandos
- Dev: `npm run dev` (`tsx src/index.ts`) — API planejada em `localhost:3000`.
- CLI: `npm run cli` (`tsx src/cli.ts`).
- Testes: `npm test` (`node --import tsx --test "src/**/*.test.ts"`).
- Typecheck: `npm run typecheck` (`tsc --noEmit`).

## Estrutura
- `src/domain`: tipos e schemas Zod; sem IO.
- `src/store`: persistência em memória atrás de interface.
- `src/service`: regras de negócio.
- `src/http`: camada HTTP.
- `src/cli.ts`: interface de linha de comando.
- `specs/`: especificações e artefatos spec-driven.

## Convenções
- Camadas não pulam: HTTP/CLI -> Service -> Store.
- Validar entradas externas com Zod.
- Erros de domínio são classes, traduzidas na borda HTTP/CLI.
- Lógica nova nasce com teste; typecheck e testes devem permanecer verdes.
- Nunca commitar segredos nem ler `.env`.

## Fluxo de trabalho
- `/especificar` -> `/planejar` -> `/tarefas` -> `/implementar`.
- Exigir revisão humana entre as fases; manter artefatos em `specs/`.
