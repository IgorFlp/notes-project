# Tarefas de implementação: gerenciamento de tarefas (001)

Base: [especificação 001](./001-task-management.spec.md) e [plano 001](./001-task-management.plan.md).

Cada tarefa deve ser implementada e revisada como uma unidade pequena. Os testes da funcionalidade fazem parte da tarefa correspondente; não iniciar uma camada antes de suas dependências estarem concluídas.

## T001 — Criar domínio e store em memória

**Dependências:** nenhuma.

**Escopo:**

- Definir tipo e schema Zod de tarefa, criação e filtro em `src/domain/`.
- Definir interface de store e implementação em memória em `src/store/`.
- Gerar IDs opacos e únicos entre tarefas armazenadas.
- Incluir testes da store para criação, busca/listagem, remoção e estados.

**Concluída quando:** os tipos e schemas correspondem à especificação, a store pode ser criada/injetada por processo e os testes da camada passam.

## T002 — Implementar regras de negócio do service

**Dependências:** T001.

**Escopo:**

- Implementar criação com normalização de título e estado inicial `open`.
- Implementar listagem `all`, `open` e `done`.
- Implementar conclusão idempotente e remoção por ID.
- Lançar erro de domínio explícito para ID inexistente.
- Criar testes unitários para regras, entradas inválidas e erros.

**Concluída quando:** o service depende apenas de domínio/store, não importa HTTP/CLI, e os cenários funcionais da camada passam.

## T003 — Implementar endpoints e tradução de erros HTTP

**Dependências:** T002.

**Escopo:**

- Implementar `POST /tasks`, `GET /tasks`, `PATCH /tasks/{id}/complete` e `DELETE /tasks/{id}` com `node:http`.
- Validar corpos, query e parâmetros com Zod na fronteira.
- Mapear erros de validação e domínio para status e códigos JSON definidos na especificação.
- Adicionar testes HTTP com servidor local efêmero para sucesso, filtros, entradas inválidas, rota desconhecida e ID inexistente.

**Concluída quando:** métodos, rotas, formatos de resposta e status HTTP estão cobertos e correspondem à especificação.

## T004 — Compor e iniciar a API

**Dependências:** T003.

**Escopo:**

- Atualizar `src/index.ts` para compor uma store em memória, o service e o servidor HTTP.
- Manter a inicialização executável pelo script `npm run dev`.
- Tornar a configuração necessária para testes/inicialização verificável sem acoplar regras de negócio ao ponto de entrada.

**Concluída quando:** `npm run dev` inicia a API e os testes HTTP exercitam a composição ou a fábrica de servidor que ela utiliza.

## T005 — Implementar CLI interativa

**Dependências:** T002.

**Escopo:**

- Implementar `src/cli.ts` usando `node:readline`, sem dependências novas.
- Suportar `create`, `list [--status all|open|done]`, `complete`, `remove` e `exit`; tratar EOF como encerramento.
- Reutilizar uma store e um service durante toda a sessão.
- Exibir sucesso em saída padrão; comunicar erros em `stderr`, continuar a sessão e retornar código diferente de zero ao encerrar se algum comando falhou.
- Testar sequências de comandos, validação, filtros, conclusão, remoção, erros e encerramento por EOF.

**Concluída quando:** uma tarefa criada pode ser consultada, concluída e removida na mesma sessão, e erros não interrompem prematuramente o processamento dos comandos seguintes.

## T006 — Atualizar documentação e verificar integração

**Dependências:** T004 e T005.

**Escopo:**

- Atualizar `README.md` com inicialização da API, uso da CLI interativa e descarte dos dados ao encerrar cada processo.
- Executar `npm test` e `npm run typecheck`.
- Corrigir falhas introduzidas pela funcionalidade e conferir a cobertura de todos os critérios de aceite da especificação.

**Concluída quando:** documentação reflete o comportamento implementado e os comandos de teste e typecheck passam.

## Ordem e paralelismo

```text
T001 -> T002 -> T003 -> T004 --+
                 \-> T005 -----+-> T006
```

T004 e T005 podem ser trabalhadas em paralelo depois de T002, desde que permaneçam em alterações isoladas e T006 aguarde ambas.
