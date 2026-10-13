# Plano técnico: persistência de tarefas da CLI (002)

Base: [especificação 002](./002-persistencia-tasks-cli.spec.md) e [constituição](./constitution.md).

## 1. Arquitetura

- Manter o fluxo `CLI -> service -> store` e o domínio sem operações de entrada/saída.
- Criar uma implementação de store baseada em JSON em `src/store/`, conforme a interface `TaskStore`, sem substituir a store em memória usada pela API HTTP.
- Compor a CLI com a store JSON em `src/cli.ts`; manter a composição da API (`src/index.ts`) com `InMemoryTaskStore`, sem compartilhar arquivo ou estado.
- A store JSON deve carregar as tarefas na inicialização, validar a estrutura lida e manter uma cópia em memória para as operações da sessão.
- Nas mutações, preparar o estado resultante, persistir esse estado e só então atualizar a cópia em memória. Se a persistência falhar, propagar o erro sem aplicar a mutação em memória, para que o tratamento existente da CLI informe o erro e continue a sessão.
- Se não houver arquivo, iniciar com store vazia. Se a leitura, análise ou validação do conteúdo falhar, emitir aviso explícito e iniciar vazia; a primeira mutação gravável deve substituir o conteúdo anterior.
- Acrescentar o caminho do arquivo ao `.gitignore` e documentar no `README.md` a persistência local da CLI, o comportamento da API e a recuperação de arquivo inválido.
- Manter o contrato síncrono atual da store para evitar mudanças desnecessárias no service e nas rotas HTTP. A gravação síncrona é aceitável para o pequeno arquivo local e mantém as operações do serviço concluídas antes de confirmar os comandos.

## 2. Modelo de dados

- Reutilizar o tipo `Task` e o schema `taskSchema` existentes em `src/domain/task.ts`; a persistência não adiciona campos nem altera as regras do domínio.
- Validar o conteúdo carregado com Zod na fronteira de leitura da store, como uma coleção de tarefas. JSON sintaticamente válido, mas com estrutura, campos ou estados inválidos, deve ser tratado como arquivo inválido.
- Serializar os campos `id`, `title` e `status` das tarefas. O formato proposto é um array JSON de tarefas, sem envelope ou metadados adicionais.
- Usar as operações de `TaskStore` para gravar tarefas criadas/concluídas e excluir tarefas removidas. A implementação deve preservar o resultado e a ordem observáveis das operações existentes.
- Não adicionar schema de entrada externo para dados internos de domínio; Zod valida a fronteira de persistência para impedir que dados inválidos sejam restaurados como tarefas.

## 3. Contratos

- **CLI (`npm run cli`):**
  - Ao iniciar, carregar as tarefas do arquivo local; arquivo ausente resulta em sessão vazia.
  - Preservar os comandos e formatos de sucesso existentes (`create`, `list`, `complete`, `remove`, `exit`).
  - Após `create`, `complete` ou `remove` bem-sucedido, persistir o estado antes de exibir a confirmação.
  - Para conteúdo inválido ou ilegível, emitir aviso em `stderr` e seguir com a sessão vazia; a próxima mutação bem-sucedida substitui o conteúdo.
  - Para falha de gravação, emitir erro em `stderr`, não confirmar a mutação, manter o estado anterior e continuar aceitando comandos. O fluxo de saída não zero da CLI para sessão com falhas permanece aplicável.
- **API HTTP:** nenhuma mudança de rota ou formato. A API continua usando store em memória por processo e não lê nem grava o arquivo JSON.
- **Arquivo:** a localização é na pasta do projeto e o arquivo deve ser ignorado pelo Git. A especificação não fixa nome nem critério técnico para determinar essa pasta; a proposta sujeita a revisão está em “Pontos para decisão humana”.

## 4. Decisões e trade-offs

- **Store dedicada à CLI:** evita que a API HTTP passe a persistir dados e permite reutilizar o service e a interface já existentes. A alternativa de tornar persistente a store compartilhada mudaria o comportamento da API e contrariaria a especificação.
- **Gravação síncrona e write-through:** mantém a interface `TaskStore` e garante que erros de gravação ocorram antes de o service confirmar a operação. Operações assíncronas evitariam bloquear o event loop, mas exigiriam tornar assíncronos store, service, CLI e pontos de integração da API, apesar de a API não precisar de persistência.
- **Validar cada tarefa restaurada:** descarta o arquivo inteiro se a estrutura persistida for inválida, em vez de restaurar parcialmente tarefas e ocultar corrupção. Essa decisão segue a especificação de iniciar sem tarefas quando o arquivo estiver inválido.
- **Substituição do arquivo:** a gravação deve evitar atualizar o estado em memória antes da persistência. Pode-se gravar o resultado em arquivo temporário no mesmo diretório e renomeá-lo após a gravação completa, reduzindo a chance de deixar JSON truncado; essa estratégia exige limpeza explícita do temporário em caso de erro.
- **Testabilidade:** permitir que os testes forneçam um caminho de arquivo isolado ou uma dependência de store à composição da CLI, sem gravar dados de teste no diretório do projeto.

## 5. Estratégia de testes

- Adicionar testes de `FileTaskStore` com diretório temporário, cobrindo:
  - carregar tarefas válidas, preservando todos os campos;
  - iniciar vazia quando o arquivo não existe e criá-lo na primeira mutação;
  - salvar criação/conclusão e remover tarefa, refletindo cada resultado em uma nova instância da store;
  - rejeitar conteúdo JSON malformado e registros que falhem no schema; verificar que a inicialização fica vazia e que a próxima mutação substitui o arquivo;
  - simular falhas de leitura e gravação, verificando aviso/erro explícito e que falhas de mutação não alteram o estado mantido pela store.
- Adaptar os testes de `src/cli.test.ts` para usar arquivo isolado e cobrir persistência entre duas execuções, aviso de arquivo inválido, erro de gravação em `stderr`, ausência de confirmação/alteração após falha e continuidade dos comandos.
- Manter ou ampliar testes HTTP para confirmar que a API ainda usa `InMemoryTaskStore` e não lê nem altera o arquivo local.
- Executar `npm test` e `npm run typecheck`; verificar também que o caminho de dados está coberto pelo `.gitignore` sem ignorar arquivos de código ou especificação.

## Riscos

- O caminho relativo ao diretório de trabalho pode variar conforme a forma de iniciar a CLI; fixar uma base inadequada pode criar mais de um arquivo de tarefas para o mesmo projeto.
- Escritas síncronas bloqueiam o event loop durante a operação, embora o volume esperado seja pequeno e a persistência ocorra somente na CLI.
- Falha de disco, permissões ou renomeação do temporário podem impedir uma alteração; a CLI deve preservar o estado anterior e reportar explicitamente o problema.

## Pontos para decisão humana

- **Nome e base do arquivo:** a proposta é usar `.tasks.json` no diretório de trabalho corrente (`process.cwd()`), assumindo que a CLI é iniciada na raiz do projeto. Confirmar essa convenção ou escolher outra forma de identificar a raiz e o nome do arquivo antes da implementação.
- **Gravação atômica:** recomenda-se escrever em arquivo temporário no mesmo diretório e renomeá-lo, em vez de sobrescrever diretamente o JSON. Confirmar se esse cuidado está no escopo desejado.
