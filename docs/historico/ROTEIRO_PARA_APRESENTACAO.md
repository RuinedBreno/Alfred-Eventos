# Roteiro de apresentação do Alfred (6 a 8 minutos)

**1. Problema e solução (45 s):** “O Alfred centraliza cinema, shows, baladas, teatro, dança e cultura. Além da compra, ajuda a descobrir o que acontece na cidade e recomenda eventos por afinidade musical.”

**2. Arquitetura (1 min):** “Frontend Vue 3 e Vite; backend Node/Express; banco MySQL com Sequelize; JWT nas rotas protegidas. Camadas: UI → rotas → serviços → repositórios → banco.” Abra `alfred-backend/app.js` e `models/index.js`.

**3. Demonstração (2 min):** Faça login como admin, mostre `/admin`, crie evento e lote. Depois faça login normal, selecione um evento, salve em favoritos, reserve de 1 a 6 ingressos e mostre `/meus-ingressos`. Cancele a reserva e prove a restauração do estoque. Mostre `/cidade` e `/seu-ritmo`.

**4. Diagrama de sequência (1 min):** Abra `docs/DIAGRAMA_DE_SEQUENCIA.md`. Explique o caminho da reserva do navegador até a transação SQL e os ramos HTTP 401 / 404 / 409.

**5. SOLID (1 min):** Abra `services/orderService.js` e mostre o construtor com dependências injetadas (DIP), separação HTTP/lógica/banco (SRP), e repositórios com contratos pequenos (ISP).

**6. Padrão Strategy (1 min):** Abra `services/recommendationService.js`, `strategies/genreStrategy.js` e `artistStrategy.js`. Mostre o `score()` intercambiável, evidenciando OCP e LSP. Execute `npm test` e apresente o resultado.

**7. Limites e roadmap (30 s):** “O projeto entrega os fluxos principais de forma demonstrativa; não processa pagamentos reais. MusicKit e pagamento com QR válido são melhorias futuras.”

## Perguntas que a professora pode fazer

**Por que usar Strategy?** Para adicionar uma nova fonte de afinidade musical sem modificar o cálculo geral, apenas inserindo outro objeto que cumpre `score(event,profile)`.

**Onde está SOLID?** As rotas tratam HTTP, os serviços tratam regras de negócio, os repositórios acessam o banco. O serviço recebe interfaces por injeção. Os testes provam intercambialidade e isolamento.

**Qual a segurança do estoque?** UPDATE condicional (`available >= quantity`) e transação; se falhar, não existe reserva confirmada.

**O que acontece em HTTP 401 / 403 / 404 / 409?** 401: sem token, 403: autenticado sem privilégio admin, 404: evento/reserva inexistente, 409: conflito de estoque ou cancelamento duplicado.

**Spotify já funciona para qualquer pessoa?** Não. Existe implementação de PKCE condicionada ao registro/configuração do app no provedor; sem autorização o usuário seleciona os gêneros manualmente.
