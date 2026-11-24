# Emissão de um ingresso

```mermaid
sequenceDiagram
    actor Pessoa
    participant Vue
    participant API
    participant Banco
    participant Stripe
    Pessoa->>Vue: Escolhe lote e quantidade
    Vue->>API: Solicita checkout com chave de repetição
    API->>Banco: Verifica pedido anterior, evento e saldo
    alt Lote gratuito
        API->>Banco: Baixa estoque, confirma e cria ingressos
        API-->>Vue: Número do pedido
    else Lote pago
        API->>Stripe: Cria sessão com preço do banco
        API->>Banco: Grava pedido pendente, saldo e sessão
        API-->>Vue: URL de checkout
        Stripe->>API: Envia notificação assinada
        API->>Banco: Confirma e emite ou cancela e devolve estoque
    end
    Vue->>API: Consulta carteira e QR individual
    API-->>Vue: Ingressos da conta autenticada
```

O organizador escolhe o evento e apresenta o identificador lido do QR à API. A transação bloqueia o registro, confere evento e pedido e registra o horário da primeira utilização.
