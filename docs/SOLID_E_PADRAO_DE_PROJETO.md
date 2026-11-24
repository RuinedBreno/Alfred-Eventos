# Alfred | Evidências de SOLID e padrão de projeto

Os pontos abaixo se referem aos **arquivos reais do projeto**. Mostre o arquivo no editor e explique o método indicado.

| Princípio | Local do código | Evidência verificável |
|---|---|---|
| **S — Responsabilidade única** | `alfred-backend/routes/orders.js`, `services/orderService.js`, `repositories/ticketRepository.js` | Rota faz HTTP/autorização, serviço executa regras, repositório opera no SQL/Sequelize. Mudanças de protocolo não exigem alterar o cálculo de reserva. |
| **O — Aberto/fechado** | `services/recommendationService.js` | `createRecommendationService(strategies)` recebe novas estratégias sem alterar o método `rank()`. |
| **L — Substituição de Liskov** | `services/strategies/genreStrategy.js`, `artistStrategy.js` | Ambas implementam `score(event,profile)` e devolvem pontuação finita não negativa, podendo ser substituídas no ranking. |
| **I — Segregação de interfaces** | `repositories/ticketRepository.js`, `repositories/orderRepository.js` | OrderService consome somente os métodos de que necessita: `findLot`, `reduceStock`, `restoreStock`, `create`, `findForUser`, `setCancelled`, `listForUser`. Não depende de um repositório universal. |
| **D — Inversão de dependência** | `services/orderService.js` | `createOrderService({ticketRepository,orderRepository,transactionManager,clock})` recebe dependências externas. Testes passam mocks, sem precisar importar MySQL. |

## Padrão implementado: Strategy (Comportamental)

**Problema:** o Alfred personaliza experiências por gêneros e artistas, e precisará aceitar outras origens de preferências no futuro sem reescrever todo o sistema.

**Implementação:**

```js
// Strategy: cada objeto oferece o contrato score(event, profile)
const genreStrategy = { name: 'generos', score(event, profile) { /* 0 a 60 */ } };
const artistStrategy = { name: 'artistas', score(event, profile) { /* 0 a 40 */ } };

const recommender = createRecommendationService([genreStrategy, artistStrategy]);
const ranked = recommender.rank(events, { genres: ['rock'], artists: ['Banda Exemplo'] });
```

A implementação integral, com as funções reais, está em `services/strategies/*.js` e `services/recommendationService.js`. Este trecho é somente o resumo para a explicação.

**Onde mostrar funcionando:** frontend `/seu-ritmo` → `GET /api/recommendations` → API aplica duas estratégias e devolve `breakdown: {generos: 60, artistas: 40}` quando ambas correspondem totalmente. Não são dados psicológicos, nem acesso indiscriminado ao histórico musical.

### Testes como prova

Execute `cd alfred-backend && npm test`. O arquivo `tests/recommendation.test.js` prova a troca de estratégias e a soma de pontuações; `tests/orderService.test.js` prova a injeção de dependências, estoque, cancelamento e isolamento de usuários.

### Como acrescentar uma estratégia de afinidade por local

Crie `services/strategies/cityStrategy.js` exportando `{name:'cidade', score(event,profile){...}}` e passe o objeto no array do `createRecommendationService`. A função `rank()` permanece inalterada, demonstrando OCP em código.

### Cuidados de qualidade

- Em todos os princípios, o foco é mostrar **responsabilidades e contratos realmente implementados**. Não basta renomear classes para `SOLID`.
- O padrão Strategy está aplicado à **recomendação**. O fluxo de reserva utiliza também **injeção de dependências** e transações de banco, mas não é uma implementação de Factory Method ou Singleton.
