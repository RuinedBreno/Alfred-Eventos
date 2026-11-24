# Alfred 2.0

Plataforma acadêmica para descobrir eventos, acompanhar artistas, reservar ingressos e compartilhar experiências. O catálogo inicial contém 16 eventos fictícios. O projeto usa Vue 3, Express e Sequelize.

## Rodar no Mac

Use Node 22.12 ou superior da linha 22, ou Node 24, e um servidor MySQL ou MariaDB ativo. A API usa a porta 3000 e o frontend usa 5173. No cliente SQL, crie o banco de desenvolvimento com uma conta que tenha permissão de criar tabelas e índices.

```sql
CREATE DATABASE IF NOT EXISTS alfred_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Na raiz do projeto, abra o primeiro terminal.

```bash
cd alfred-backend
npm ci
npm run config:local
```

Abra o arquivo `.env` criado na pasta do backend. Informe o usuário e a senha do **teu MySQL ou MariaDB** em `DB_USER` e `DB_PASSWORD`. Confira `DB_HOST`, `DB_PORT` e `DB_NAME`. O comando gera um segredo de sessão próprio na primeira execução. Se reaproveitar um banco de uma versão anterior, faça um backup antes de migrar.

```bash
npm run migrate
npm run seed
npm run ibge:import -- --offline
npm run dev
```

No segundo terminal, a partir da raiz do projeto, execute os comandos abaixo.

```bash
cd alfred-frontend
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173**. A API responde em **http://127.0.0.1:3000/api**. A importação offline utiliza o catálogo oficial de 5.571 municípios e 27 UFs incluído no ZIP. Para atualizar pelo IBGE, execute `npm run ibge:import` com acesso à internet. Se o banco local não aceitar conexão por `localhost`, confira a porta e tente `DB_HOST=127.0.0.1`.

## Primeira demonstração

1. Entre em **Cadastrar**, selecione seus interesses e crie uma conta. Faça login.
2. Em **Minha cidade**, limpe o campo de cidade e marque **Com ingressos gratuitos disponíveis**. A carga inicial inclui o lote **Entrada gratuita** no evento de ID 11. Abra o evento e selecione esse lote.
3. Clique em **Emitir ingresso gratuito**. A carteira exibe um QR individual para cada unidade. Reabrir a carteira recupera o pedido do banco.
4. Em **Moments**, publique uma foto JPEG, PNG ou WebP de até 500 KB. Em **Perfil**, escolha os interesses e a visibilidade da cidade e das publicações.
5. Em **Seu ritmo**, selecione gêneros ou conecte uma plataforma de música. O ranking combina gêneros, artistas, interesses, cidade, categorias favoritas e popularidade.

### Organizador e controle de entrada

Para criar uma conta de organizador, configure `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_NAME` e `ADMIN_PASSWORD` (12 caracteres ou mais) no `.env` do backend. Use um e-mail novo. Execute `npm run admin:create` e retire a senha administrativa do arquivo depois. Entre na aplicação com essa conta e abra **Painel**.

O painel permite cadastrar locais, eventos e lotes, revisar denúncias e validar entradas. Selecione o evento e cole o código exibido abaixo do QR ou leia-o com um leitor que digite o código. Uma segunda tentativa de entrada com o mesmo ingresso é recusada.

### Reservas, pagamento e carteira

| Ação | Resultado |
|---|---|
| Simular reserva | Registra uma simulação. Pela API, a reserva reduz o estoque e o cancelamento devolve as unidades. Em modo offline, o comprovante fica no navegador. |
| Emitir ingresso gratuito | Reserva o estoque, confirma o pedido e gera um QR por unidade em uma transação. |
| Ir para pagamento | Abre o Stripe Checkout para o lote pago. O backend define preço, moeda BRL e quantidade. |
| Consultar pagamento | Reabre uma sessão pendente ou reconcilia o resultado com a Stripe. Uma sessão expirada devolve as unidades. |

Para experimentar a cobrança, use o modo de testes da Stripe. No backend, configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `FRONTEND_URL`. O endpoint é `POST /api/payments/webhook` e os eventos usados são `checkout.session.completed` e `checkout.session.expired`. No desenvolvimento local, a Stripe CLI pode encaminhá-los com `stripe listen --forward-to 127.0.0.1:3000/api/payments/webhook`. Use o segredo de assinatura da origem que envia o webhook. Reinicie a API depois de alterar o ambiente. Os testes incluídos exercitam confirmações, expiração e reenvio de eventos assinados localmente. A homologação com uma conta de comerciante está pendente.

### Spotify e Apple Music

Copie `alfred-frontend/.env.example` para `alfred-frontend/.env` e reinicie o Vite quando alterar os valores.

| Integração | Configuração e uso |
|---|---|
| Spotify | Defina `VITE_SPOTIFY_CLIENT_ID`. Cadastre no aplicativo Spotify a URL exata `http://127.0.0.1:5173/spotify/callback`. O botão abre o fluxo PKCE e solicita leitura de artistas e faixas mais ouvidos. |
| Apple Music | Defina `VITE_APPLE_MUSIC_DEVELOPER_TOKEN` com um token MusicKit válido para a origem do frontend. Mantenha a chave privada de assinatura fora do projeto. Após a autorização, o Alfred importa até 20 artistas da biblioteca. |
| Preferências manuais | Funcionam com a API e o banco locais, inclusive quando os provedores estão sem configuração. |

## Código e evidências

- `alfred-backend/routes` contém os contratos HTTP. `services/checkout.js` coordena pagamento e emissão. `services/recommendationService.js` combina as estratégias de recomendação.
- `alfred-backend/models/index.js` define as entidades relacionais. `scripts/migrate.js` cria tabelas faltantes e atualiza campos de versões anteriores.
- `alfred-frontend/src/views` contém as telas. `src/services` concentra as chamadas HTTP e integrações musicais. `src/stores` mantém a sessão e preferências do navegador.
- [Resultados e reprodução dos testes](docs/VALIDACAO.md) · [Diagrama de emissão](docs/EMISSAO.md) · [SOLID e Strategy](docs/SOLID_E_PADRAO_DE_PROJETO.md).
- `docs/historico` preserva o escopo, os resultados e o roteiro da entrega anterior de 70%. O README e o relatório de validação descrevem esta versão.
