# notas-api

Esqueleto inicial de uma API de notas com Node.js e TypeScript. O projeto ainda não implementa endpoints nem operações de notas.

## Pré-requisitos

- Node.js compatível com as versões atuais de TypeScript e `tsx`
- npm

## Instalação

Na raiz do projeto, instale as dependências:

```bash
npm install
```

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Executa `src/index.ts` com `tsx`. O arquivo atual é apenas um placeholder; a API ainda não está implementada. |
| `npm run cli` | Executa `src/cli.ts` com `tsx`. Esse arquivo ainda precisa ser criado. |
| `npm test` | Executa os testes TypeScript encontrados em `src/**/*.test.ts`. Ainda não há testes no projeto. |
| `npm run typecheck` | Verifica os arquivos TypeScript com `tsc --noEmit`. |

## Estrutura atual

```text
.
├── src/
│   └── index.ts
├── package.json
└── tsconfig.json
```

O projeto usa módulos ES (`"type": "module"`) e TypeScript com alvo ES2022, modo estrito e resolução de módulos `NodeNext`. O Zod está disponível como dependência de produção; TypeScript, `tsx` e os tipos do Node são dependências de desenvolvimento.

## Próximos passos

Adicione a implementação da API em `src/index.ts`, crie `src/cli.ts` caso precise de uma interface de linha de comando e inclua os testes em arquivos com o padrão `*.test.ts` dentro de `src/`.
