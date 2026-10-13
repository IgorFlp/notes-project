# Plano de implementação: gerenciamento de tarefas (001)

## Objetivo

Implementar os requisitos de [001-task-management.spec.md](./001-task-management.spec.md), expondo criação, listagem por estado, conclusão e remoção de tarefas pela API HTTP e por uma CLI interativa. Este documento planeja o trabalho; não registra implementação concluída.

## Decisões e limites

- Preservar TypeScript ESM estrito, Zod, `node:http`, `node:test` via `tsx` e as dependências atuais.
- Manter as dependências em `HTTP/CLI -> service -> store`; nenhuma camada inferior importa uma superior.
- Criar uma store em memória por processo e injetá-la no service usado pela interface daquele processo.
- A CLI é interativa para que vários comandos acessem a mesma store até `exit` ou EOF. Iniciar outra sessão começa sem tarefas; não adicionar persistência em arquivo.
- `create` normaliza o título e atribui ID; `complete` é idempotente; IDs inexistentes geram erro de domínio.
- Não adicionar recursos fora do escopo (edição, datas, autenticação ou persistência durável).

## Sequência de trabalho

1. **Domínio e persistência em memória**
   - Criar tipos e schemas Zod de tarefa, criação e filtro em `src/domain/`.
   - Definir interface do store e implementação em memória em `src/store/`.
   - Usar ID opaco gerado pela aplicação; cobrir unicidade dentro da store e operações básicas com testes.
2. **Regras de negócio**
   - Implementar service em `src/service/` para criar, listar, concluir e remover.
   - Adicionar erros de domínio explícitos para tarefa inexistente.
   - Testar normalização/validação, filtros, conclusão repetida, remoção e IDs inexistentes.
3. **API HTTP**
   - Implementar roteamento com `node:http` e tradução dos contratos da especificação em `src/http/`.
   - Validar corpo, query e parâmetros na fronteira com Zod; converter erros de domínio em respostas HTTP documentadas.
   - Atualizar `src/index.ts` para compor store, service e servidor sem duplicar lógica.
   - Testar endpoints e respostas de sucesso/erro usando servidor local efêmero.
4. **CLI interativa**
   - Implementar `src/cli.ts` com `node:readline` (sem biblioteca nova), mantendo uma instância de store/service durante a sessão.
   - Interpretar `create`, `list [--status ...]`, `complete`, `remove` e `exit`; tratar EOF como encerramento.
   - Reportar falhas em `stderr`, continuar aceitando comandos e retornar status não zero ao encerrar se houve falha em qualquer comando.
   - Testar comandos em sequência e cenários inválidos usando streams ou processo filho, evitando dependência de entrada manual.
5. **Integração e documentação**
   - Atualizar `README.md` com inicialização da API e uso da CLI interativa, incluindo a semântica de dados voláteis.
   - Rodar testes e typecheck; corrigir regressões relacionadas a esta funcionalidade.

## Arquivos previstos

- `src/domain/task.ts`
- `src/store/task-store.ts`
- `src/store/in-memory-task-store.ts`
- `src/service/task-service.ts`
- `src/service/task-service.test.ts`
- `src/http/` para servidor/rotas e testes HTTP
- `src/index.ts`
- `src/cli.ts` e testes da CLI
- `README.md`

Os nomes e divisão dos arquivos HTTP podem ser adaptados aos padrões encontrados durante a implementação, mantendo os limites de camada.

## Critérios de conclusão

- Todos os critérios de aceite da especificação 001 têm cobertura automatizada.
- `npm test` e `npm run typecheck` passam.
- Fluxos HTTP e CLI usam o mesmo service e store por processo, sem duplicar regras de negócio.
- README e contratos implementados correspondem à especificação revisada, incluindo sessão CLI interativa e perda de dados ao encerrar.
