# Como subir o Alfred no GitHub

O ZIP contém um projeto local **sem remote configurado**. Ele não foi enviado automaticamente ao GitHub.

## A) Criar um repositório novo

1. Crie um repositório vazio no GitHub, chamado por exemplo `alfred`.
2. Abra o Terminal dentro da pasta `Alfred-Entrega-70` (que contém `alfred-frontend` e `alfred-backend`).
3. Execute:

```bash
git init
git branch -M main
git add .
git commit -m "feat: evolucao 70 por cento Alfred, SOLID e Strategy"
git remote add origin https://github.com/SEU_USUARIO/alfred.git
git push -u origin main
```

**Substitua** `SEU_USUARIO` pelo dono do repositório. O GitHub poderá pedir autenticação (token/SSH/CLI). Nunca adicione `.env`, senhas ou credenciais ao Git.

## B) Se já existe um repositório do Alfred

Trabalhe a partir do clone atual e mantenha o histórico existente. Copie para ele **os arquivos desta entrega**, mantendo `alfred-frontend/`, `alfred-backend/` e `docs/` no mesmo nível. Não copie a pasta `.git` de outro projeto.

```bash
git status
git add .
git commit -m "feat: painel admin, reservas, SOLID, Strategy e diagramas"
git push origin NOME_DA_SUA_BRANCH
```

Confirme o status no GitHub após o envio; **um commit local não equivale a um push**.
