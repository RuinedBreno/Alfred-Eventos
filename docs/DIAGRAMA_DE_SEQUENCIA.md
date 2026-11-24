# Alfred | Diagramas de sequência (UML)

## Fluxo principal: reserva de ingressos de demonstração

O GitHub renderiza o diagrama Mermaid a seguir automaticamente quando este arquivo é aberto. Também existe uma versão PNG para colocar em slides:

![Diagrama de sequência UML do fluxo de reserva](diagrama_sequencia_reserva.png)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant UI as Vue / EventView
    participant API as Express / orders.js
    participant JWT as Middleware JWT
    participant S as OrderService
    participant T as TransactionManager
    participant R as TicketRepository
    participant O as OrderRepository
    participant DB as MySQL
    U->>UI: Escolhe lote e quantidade (1 a 6)
    UI->>API: POST /api/orders/demo + JWT
    API->>JWT: Validar token
    alt Token inválido
        JWT-->>UI: HTTP 401
    else Token válido
        JWT-->>API: req.user.id
        API->>S: reserve(userId, lotId, quantity)
        S->>S: Validar entrada (HTTP 400)
        S->>T: run(transação)
        T->>DB: BEGIN
        S->>R: findLot(lotId)
        R->>DB: SELECT lot e evento
        DB-->>R: Lote, evento, data
        R-->>S: Dados do lote
        alt Evento ausente, inativo ou encerrado
            S-->>T: Erro HTTP 404
            T->>DB: ROLLBACK
            API-->>UI: HTTP 404
        else Evento disponível
            S->>R: reduceStock(lotId, quantidade)
            R->>DB: UPDATE ... WHERE available >= quantidade
            DB-->>R: 0 ou 1 linha alterada
            alt Estoque insuficiente
                R-->>S: false
                S-->>T: Erro HTTP 409
                T->>DB: ROLLBACK
                API-->>UI: HTTP 409
            else Estoque suficiente
                R-->>S: true
                S->>O: create(order, transaction)
                O->>DB: INSERT orders (status=DEMO)
                DB-->>O: Reserva ID
                O-->>S: Reserva registrada
                T->>DB: COMMIT
                S-->>API: Reserva
                API-->>UI: HTTP 201 + dados
                UI-->>U: Mensagem de confirmação fictícia
            end
        end
    end
```

## Fluxo complementar: recomendações personalizadas

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant UI as Vue / RhythmView
    participant API as GET /recommendations
    participant DB as Event + Venue
    participant R as RecommendationService
    participant G as GenreStrategy
    participant A as ArtistStrategy
    U->>UI: Seleciona gêneros / autoriza artistas
    UI->>API: GET /api/recommendations?city&genres&artists
    API->>DB: Consulta eventos publicados e futuros
    DB-->>API: Eventos + gêneros + artistas
    API->>R: rank(events, profile)
    loop Para cada evento
        R->>G: score(event, profile)
        G-->>R: 0 até 60 pontos
        R->>A: score(event, profile)
        A-->>R: 0 até 40 pontos
    end
    R-->>API: Eventos com pontuação de 0 a 100
    API-->>UI: HTTP 200 + ranking
    UI-->>U: Lista ordenada de eventos compatíveis
```

### Como explicar em sala

- As **linhas verticais** representam participantes ao longo do tempo.
- As **setas** representam chamadas/respostas.
- Os blocos **alt/else** documentam o caminho de sucesso e as falhas: 400 (entrada), 401 (sem autenticação), 404 (indisponível), 409 (estoque insuficiente).
- A **transação** impede criar uma reserva sem reduzir estoque ou reduzir estoque sem criar reserva.
- O uso de **Strategy** permite adicionar outra lógica de recomendação com o mesmo contrato de pontuação.

> Todos os eventos, reservas e preços desta entrega são fictícios. Não existem pagamentos ou tickets oficiais.
