# Especificação: gerenciamento de tarefas

## Objetivo

Disponibilizar operações simples de tarefas pela API HTTP e pela CLI: criar uma tarefa com título, listar tarefas, concluir uma tarefa e remover uma tarefa.

## Escopo

Incluído:

- Criar tarefa informando um título.
- Listar tarefas sem filtro ou filtradas por estado.
- Concluir e remover uma tarefa identificada por ID.
- Expor as mesmas operações pela API HTTP e pela CLI.
- Manter dados em memória durante a execução do processo.

Fora do escopo: persistência após reinício, edição de tarefas, subtarefas, prioridades, prazos, busca textual, autenticação e sincronização entre processos.

## Modelo de domínio

Uma tarefa contém:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | string | Gerado pela aplicação, único entre as tarefas armazenadas e opaco para os clientes. |
| `title` | string | Obrigatório; remover espaços em branco das extremidades e rejeitar se ficar vazio. Espaços internos são preservados. |
| `status` | `open` \| `done` | Uma tarefa nova começa como `open`; concluir altera o estado para `done`. |

Títulos não precisam ser únicos. Não são necessários campos de data para satisfazer as operações deste escopo.

## Requisitos funcionais

1. A criação deve armazenar uma tarefa com ID gerado, título normalizado e estado `open`.
2. A listagem deve permitir selecionar todas as tarefas (`all`), somente abertas (`open`) ou somente concluídas (`done`).
3. Concluir uma tarefa deve localizar a tarefa pelo ID e definir seu estado como `done`. Repetir a conclusão de uma tarefa já concluída deve ser bem-sucedido sem alterar o resultado.
4. Remover uma tarefa deve excluí-la pelo ID, independentemente do estado atual.
5. Operações dirigidas a um ID inexistente devem falhar explicitamente; não devem retornar sucesso com resultado vazio.
6. Cada processo mantém sua própria store em memória; não há compartilhamento entre processos, e reiniciar um processo limpa seus dados.

## Contrato HTTP

Os endpoints usam JSON quando há corpo de requisição.

### Criar tarefa

`POST /tasks`

Corpo:

```json
{ "title": "Comprar leite" }
```

Sucesso: `201 Created`, com a tarefa criada no corpo da resposta.

### Listar tarefas

`GET /tasks?status={all|open|done}`

- `status` é opcional e assume `all` quando omitido.
- Um valor diferente de `all`, `open` ou `done` retorna `400 Bad Request`.
- Sucesso: `200 OK`, com um array JSON de tarefas no corpo (inclusive quando vazio). `all` inclui os dois estados; os outros valores retornam somente o estado correspondente.

Exemplo:

```json
[
  { "id": "opaque-id", "title": "Comprar leite", "status": "open" }
]
```

### Concluir tarefa

`PATCH /tasks/{id}/complete`

Sucesso: `200 OK`, com a tarefa concluída no corpo. Concluir novamente uma tarefa concluída também retorna `200 OK`.

### Remover tarefa

`DELETE /tasks/{id}`

Sucesso: `204 No Content`, sem corpo.

### Erros HTTP

Respostas de erro usam um formato JSON consistente:

```json
{ "error": { "code": "TASK_NOT_FOUND", "message": "Tarefa não encontrada." } }
```

- Corpo inválido, título ausente ou título vazio: `400 Bad Request`, código `VALIDATION_ERROR`.
- Filtro de estado inválido: `400 Bad Request`, código `INVALID_STATUS_FILTER`.
- ID inexistente em conclusão ou remoção: `404 Not Found`, código `TASK_NOT_FOUND`.
- Rota não reconhecida: `404 Not Found`.

As mensagens podem ser localizadas; os códigos são estáveis para clientes.

## Contrato CLI

`npm run cli` inicia uma sessão interativa que mantém a store em memória viva até o usuário sair. Cada linha aceita um comando:

```text
create "Comprar leite"
list
list --status open
list --status done
list --status all
complete <id>
remove <id>
exit
```

- `create` recebe o título como argumento; título ausente, vazio ou composto apenas de espaços é erro.
- `list` sem `--status` lista todas as tarefas; valores permitidos para `--status` são `all`, `open` e `done`.
- `complete` e `remove` recebem um ID.
- Os comandos podem ser repetidos na mesma sessão; uma tarefa criada pode ser listada, concluída e removida antes de `exit`.
- `exit` ou EOF encerra a sessão. Os dados são descartados ao sair; iniciar outra sessão começa com uma store vazia.
- Saídas de sucesso devem permitir identificar a tarefa por ID e exibir título e estado quando aplicável.
- Erros devem ser comunicados em `stderr`, sem encerrar a sessão; continuar a sessão não pode ocultar a falha. A sessão termina com código diferente de zero se algum comando falhou. Uma operação com ID inexistente não pode parecer bem-sucedida.

## Arquitetura e validação

- Validar entradas externas com Zod nas fronteiras HTTP e CLI.
- Manter o fluxo de dependências HTTP/CLI -> service -> store; domínio e service não dependem das camadas de borda.
- Representar falhas previsíveis como erros de domínio e traduzi-las em códigos HTTP ou mensagens/códigos de saída na respectiva borda.
- Implementar persistência em memória por trás de uma interface de store.
- Cobrir regras de negócio e contratos das duas interfaces com testes automatizados.

## Critérios de aceite

1. Uma chamada HTTP válida e um comando CLI válido criam tarefa com ID, título normalizado e estado `open`.
2. Título ausente, vazio ou composto apenas de espaços é rejeitado pelas duas interfaces.
3. A listagem sem filtro e com cada filtro `all`, `open` e `done` retorna apenas as tarefas esperadas.
4. Concluir por ID muda o estado para `done`; repetir a operação não falha.
5. Remover por ID exclui tarefa aberta ou concluída.
6. Concluir ou remover ID inexistente produz erro explícito nas duas interfaces.
7. A API respeita os métodos, caminhos, corpos e status HTTP definidos nesta especificação.
8. A CLI comunica falhas em `stderr` e retorna código de saída diferente de zero.
9. Typecheck e testes permanecem verdes; testes incluem os fluxos HTTP e CLI e os casos inválidos descritos acima.
