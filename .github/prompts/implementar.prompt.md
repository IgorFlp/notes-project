---
mode: agent
description: "Implementa tarefas pendentes uma por vez, com testes e typecheck."
argument-hint: "Informe o número ou o caminho da feature"
---

Implemente as tarefas pendentes do `tasks.md` da feature indicada pelo usuário (texto após o comando).

## Fluxo obrigatório

1. Localize a feature pelo número ou caminho informado. Leia o `tasks.md`, a especificação (`spec.md`), o plano (`plan.md`), [specs/constitution.md](../../specs/constitution.md) e todas as instruções aplicáveis antes de alterar código. Se os nomes dos documentos diferirem, identifique os documentos correspondentes da feature.
2. Se a feature não puder ser identificada sem ambiguidade, algum documento obrigatório estiver ausente, ou a especificação estiver incorreta ou contraditória, pare sem implementar e explique o bloqueio. Não invente requisitos nem corrija a especificação por conta própria.
3. Escolha uma única próxima tarefa marcada `- [ ]` cujas dependências estejam concluídas (`- [x]`). Respeite a ordem das dependências e não trabalhe em tarefas bloqueadas por dependências pendentes.
4. Implemente somente essa tarefa, seguindo o plano, as instruções aplicáveis e a constituição. Não desative nem enfraqueça testes ou verificações de tipos para obter uma aprovação artificial.
5. Escreva ou atualize testes para a alteração e execute `npm run test` e `npm run typecheck`. Se qualquer comando falhar, investigue e corrija a causa relacionada antes de prosseguir; não marque a tarefa como concluída enquanto as verificações não passarem.
6. Atualize o `tasks.md` marcando essa tarefa como `- [x]` somente após implementação e verificações bem-sucedidas. Mantenha as demais tarefas inalteradas.
7. Pare após concluir uma fatia coesa de trabalho e solicite revisão humana antes de iniciar outra tarefa.

Ao relatar o resultado, identifique a tarefa concluída, os arquivos relevantes e os resultados dos testes e do typecheck. Se houver bloqueio ou falha que não possa ser resolvida sem alterar a especificação, pare e explique, deixando a tarefa pendente.
