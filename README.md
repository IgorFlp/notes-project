# notas-api

API HTTP e CLI interativa para criar, listar, concluir e remover tarefas. O projeto usa Node.js 22, TypeScript ESM, Zod e `node:http`.

## Pré-requisitos

- Node.js 22
- npm

## Instalação

```bash
npm install
```

## API HTTP

Inicie o servidor:

```bash
npm run dev
```

A API escuta em `http://127.0.0.1:3000`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/tasks` | Cria tarefa com corpo JSON `{"title":"Comprar leite"}` |
| `GET` | `/tasks?status=all\|open\|done` | Lista tarefas; o filtro é opcional e assume `all` |
| `PATCH` | `/tasks/{id}/complete` | Conclui uma tarefa; repetir é seguro |
| `DELETE` | `/tasks/{id}` | Remove uma tarefa |

As respostas de erro usam JSON com `error.code` e `error.message`. Erros de validação retornam `400`, IDs inexistentes retornam `404` com `TASK_NOT_FOUND`, e remoção bem-sucedida retorna `204`.

Exemplo:

```bash
curl.exe -X POST http://127.0.0.1:3000/tasks `
  -H "content-type: application/json" `
  -d '{"title":"Comprar leite"}'
```

## CLI interativa

Inicie a sessão:

```bash
npm run cli
```

Digite um comando por linha:

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

`Ctrl+Z`/EOF também encerra a sessão. Erros são enviados para `stderr`, a sessão continua e o processo termina com status diferente de zero se algum comando falhou. O título é aparado nas extremidades e não pode ficar vazio.

## Dados

As tarefas ficam em memória no processo. Os comandos da CLI compartilham a mesma store durante uma sessão; os dados são descartados ao sair ou encerrar o processo. Uma instância separada da API e uma sessão da CLI não compartilham estado.

## Desenvolvimento

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API HTTP |
| `npm run cli` | Inicia a CLI interativa |
| `npm test` | Executa os testes automatizados |
| `npm run typecheck` | Verifica os tipos TypeScript |
