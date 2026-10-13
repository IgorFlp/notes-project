# Especificação: persistência de tarefas da CLI

## 1. Contexto e problema

A CLI mantém as tarefas somente em memória durante uma sessão. Ao encerrar o processo, as tarefas são perdidas, impedindo que o usuário retome o trabalho em uma sessão posterior.

Esta funcionalidade deve preservar as tarefas da CLI entre sessões por meio de um arquivo JSON local à pasta do projeto. O arquivo contém os dados necessários para restaurar as tarefas e deve ser ignorado pelo Git, pois representa dados locais do usuário. A persistência se aplica somente à CLI: a API HTTP mantém seu comportamento atual, com dados em memória independentes.

## 2. User Stories

- Com usuário da CLI, quero manter minhas tarefas entre sessões, para retomar o trabalho sem recriá-las.
- Com responsável pelo projeto, quero que o arquivo local de tarefas não seja versionado, para evitar incluir dados de uso local nos commits.

## 3. Requisitos funcionais

- **RF-1:** Ao iniciar, a CLI deve carregar as tarefas válidas do arquivo JSON local à pasta do projeto para a sessão atual.
- **RF-2:** Se o arquivo ainda não existir, a CLI deve iniciar com uma lista vazia; o arquivo deve ser criado ao persistir a primeira alteração bem-sucedida.
- **RF-3:** Após criar, concluir ou remover uma tarefa com sucesso, a CLI deve persistir o estado atual das tarefas, incluindo seus identificadores, títulos e estados, para restauração em sessões posteriores.
- **RF-4:** Se o arquivo existir, mas contiver JSON inválido ou não puder ser lido, a CLI deve avisar o usuário, iniciar a sessão sem tarefas e tentar substituir o arquivo na próxima alteração de tarefa que puder ser gravada.
- **RF-5:** Se a gravação de uma alteração falhar, a CLI deve comunicar o erro em `stderr`, não confirmar nem manter a alteração em memória e continuar aceitando comandos na sessão.
- **RF-6:** O arquivo de dados local da CLI deve ser ignorado pelo Git e não deve ser incluído nos commits do projeto.
- **RF-7:** A persistência da CLI não deve alterar nem compartilhar o armazenamento da API HTTP, que continua mantendo os próprios dados em memória.

## 4. Critérios de aceite

1. Quando a CLI iniciar e o arquivo contiver tarefas válidas, o sistema deve disponibilizar essas tarefas para listagem, conclusão e remoção na sessão.
2. Quando a CLI iniciar sem arquivo de dados, o sistema deve iniciar com uma lista vazia e criar o arquivo ao persistir a primeira alteração bem-sucedida.
3. Quando uma tarefa for criada, concluída ou removida com sucesso, o sistema deve salvar o estado atualizado para que uma nova sessão da CLI restaure esse estado.
4. Quando o arquivo contiver JSON inválido ou não puder ser lido, o sistema deve avisar o usuário, iniciar sem tarefas e tentar substituir o conteúdo inválido na próxima alteração que puder ser gravada.
5. Quando uma gravação falhar, o sistema deve informar o erro em `stderr`, preservar o estado anterior da sessão, não confirmar a alteração e continuar a CLI; ao encerrar, deve respeitar o código de saída não zero definido para sessões com comandos que falharam.
6. Quando o arquivo de dados for criado ou atualizado, o sistema deve mantê-lo ignorado pelo Git.
7. Quando a API HTTP for iniciada ou utilizada, o sistema deve manter seu comportamento em memória sem carregar nem alterar os dados persistidos pela CLI.

## 5. Fora de escopo

- Persistência ou compartilhamento de dados da API HTTP.
- Sincronização entre processos ou entre sessões simultâneas da CLI.
- Sincronização remota, backup ou migração de dados.
- Alterações nas operações e regras de negócio de tarefas que não sejam necessárias para carregar e persistir o estado existente.

## 6. Questões em aberto

Nenhuma no momento.
