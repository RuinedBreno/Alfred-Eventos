# Alfred 2.0 — Guia rápido para Windows (PowerShell)

1. Extraia o ZIP em uma pasta de sua escolha, sem alterar os nomes internos.
2. Instale o **Node.js compatível com o Vite 8** e o **MySQL 8 ou superior**, se ainda não os tiver.
3. Abra o MySQL Workbench ou outro cliente do MySQL e execute:

```sql
CREATE DATABASE alfred_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Abra o PowerShell na pasta `alfred-backend` e rode:

```powershell
npm ci
npm run config:local
notepad .env
npm run migrate
npm run seed
npm run ibge:import -- --offline
npm run dev
```

No `.env`, configure `DB_NAME=alfred_db`, seu `DB_USER`, sua senha `DB_PASSWORD` e um `JWT_SECRET` longo e seguro. O catálogo incluído permite importar as cidades offline. Não feche esta janela.

5. Abra **outro** PowerShell na pasta `alfred-frontend`:

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

6. Abra no navegador: **http://127.0.0.1:5173**.

7. Para verificar código e testes, em mais uma janela de terminal:

```powershell
cd alfred-backend
npm run check
npm test
```

Para compilar o frontend, na pasta `alfred-frontend` rode `npm run build`.

**Importante:** os eventos são fictícios. O Alfred Wallet contém somente comprovantes de reserva DEMO; não há ingresso válido nem pagamentos reais.

Se o MySQL já tiver dados importantes, faça backup antes de executar `npm run migrate`. Se surgir algum erro, consulte `docs/VALIDACAO.md` e corrija antes de avançar. Evite apagar bancos existentes.
