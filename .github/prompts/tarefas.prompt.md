---
mode: agent
description: "Quebra o plano de uma feature em tarefas pequenas, ordenadas e testáveis."
argument-hint: "Informe o número ou o caminho da especificação"
---

Gere o `tasks.md` para a feature indicada pelo usuário. O texto após o comando identifica a feature pelo número ou pelo caminho.

## Instruções

- Localize a especificação correspondente em `specs/`. Se o usuário informar um caminho, use-o para identificar a pasta da feature; se informar um número, procure a especificação com esse número.
- Leia a especificação (`spec.md`) e o plano técnico (`plan.md`) da feature antes de gerar as tarefas. Se os nomes reais dos arquivos diferirem, use os documentos correspondentes na mesma pasta da feature.
- Se não for possível identificar a feature sem ambiguidade, ou se faltarem documentos ou informações necessários, pergunte ao usuário e aguarde antes de criar ou finalizar as tarefas.
- Crie `tasks.md` na mesma pasta da especificação e do plano.
- Não implemente nada nem altere código. Gere apenas a lista de tarefas.
- Ordene as tarefas conforme suas dependências: cada pré-requisito deve aparecer antes da tarefa que depende dele.
- Use uma lista numerada. Cada item deve começar com `- [ ]` e descrever uma tarefa pequena o suficiente para caber em um único commit.
- Para cada tarefa, declare um critério verificável de pronto (por exemplo, o teste específico passa) e suas dependências, quando houver. Se não houver dependências, escreva “Dependências: nenhuma”.
- Divida o trabalho em tarefas coesas, sem adicionar requisitos que não estejam na especificação ou no plano.
- Antes de concluir, confira a ordem das dependências, o critério de pronto e o formato `- [ ]` de cada tarefa; confirme que somente `tasks.md` foi criado ou alterado.
