# Tarefas de implementação: persistência de tarefas da CLI (002)

Base: [especificação 002](./002-persistencia-tasks-cli.spec.md) e [plano 002](./002-persistencia-tasks-cli.plan.md).

Cada tarefa deve ser implementada e revisada como uma unidade pequena. Os testes da funcionalidade fazem parte da tarefa correspondente.

- [x] **T001 — Implementar store JSON e testes unitários**

**Dependências:** nenhuma.

**Escopo:**

- Criar implementação de `TaskStore` baseada em JSON em `src/store/`, serializando arrays de tarefas com `id`, `title` e `status`.
- Carregar e validar o arquivo `.tasks.json` no diretório de trabalho informado; iniciar vazia se não existir.
- Em caso de erro de leitura, JSON inválido ou estrutura que não corresponda ao schema, emitir aviso explícito e iniciar sem tarefas.
- Para cada mutação, persistir o estado resultante antes de atualizar o estado mantido em memória.
- Gravar por arquivo temporário no mesmo diretório e renomeá-lo para substituir o arquivo; limpar o temporário se uma falha impedir a conclusão da gravação.
- Incluir testes com diretório temporário para carregar, criar, concluir, remover, arquivo ausente/inválido e falhas de leitura/gravação. Confirmar que uma mutação que falha não muda o estado em memória.

**Concluída quando:** os testes da store demonstram restauração entre instâncias, substituição atômica e preservação do estado anterior em falhas.

- [x] **T002 — Integrar store persistente à CLI**

**Dependências:** T001.

**Escopo:**

- Atualizar `src/cli.ts` para compor `TaskService` com a store JSON, usando `.tasks.json` relativo a `process.cwd()`.
- Permitir que os testes forneçam um caminho isolado, sem gravar dados no diretório real do projeto.
- Emitir avisos de carregamento inválido em `stderr` e preservar os comandos e formatos de saída existentes.
- Exibir confirmação de criação, conclusão ou remoção somente depois que a persistência for concluída.
- Em falha de gravação, informar o erro em `stderr`, não confirmar a operação, preservar o estado anterior e continuar aceitando comandos; ao encerrar, manter o código não zero para sessão com falha.
- Adicionar testes de CLI para persistência entre duas execuções, recuperação de conteúdo inválido, erro de gravação, ausência de confirmação e continuidade da sessão.

**Concluída quando:** os testes da CLI provam que tarefas persistem entre sessões e que falhas não são reportadas como sucesso nem alteram o estado mantido pela store.

- [x] **T003 — Ignorar o arquivo local e atualizar documentação**

**Dependências:** nenhuma.

**Escopo:**

- Adicionar `.tasks.json` ao `.gitignore`, sem ignorar outros arquivos JSON do projeto.
- Atualizar a seção de dados do `README.md`: explicar que a CLI restaura tarefas desse arquivo, que a API permanece independente e em memória, e que conteúdo inválido gera aviso e sessão vazia até a próxima alteração gravável.
- Documentar que a CLI deve ser iniciada na raiz do projeto para usar o arquivo esperado.

**Concluída quando:** o README descreve o comportamento definido na especificação e `.tasks.json` é ignorado pelo Git sem afetar arquivos de especificação ou código.

- [x] **T004 — Verificar integração e critérios de aceite**

**Dependências:** T001, T002 e T003.

**Escopo:**

- Confirmar com teste ou inspeção automatizada que a composição da API continua usando `InMemoryTaskStore` e não acessa `.tasks.json`.
- Executar `npm test` e `npm run typecheck`.
- Conferir a cobertura dos critérios de aceite da especificação 002, inclusive recuperação de arquivo inválido, falha de gravação e persistência entre sessões.

**Concluída quando:** testes e typecheck passam e os critérios de aceite da especificação têm cobertura verificável.

## Ordem

```text
T001 -> T002 --+
               +-> T004
T003 ----------+
```
