> **Histórico:** esta página descreve a entrega 0.7. Consulte `STATUS_ALFRED_2_0.md` para a versão mais recente.

# Evolução do Alfred | Entrega acadêmica de aproximadamente 70% do escopo

## Escopo implementado (funcional)

| Funcionalidade | Frontend | Backend | Observação |
|---|---|---|---|
| Catálogo de 6 categorias | ✅ | ✅ | Busca por cidade, categoria e nome |
| Agenda de locais e próximos eventos | ✅ | ✅ | Geolocalização com permissão do navegador |
| Cadastro / Login JWT | ✅ | ✅ | Senha protegida com bcrypt |
| Detalhes / lotes de ingresso | ✅ | ✅ | Validação de quantidade e disponibilidade |
| Reserva de demonstração | ✅ | ✅ | Transação no banco, atualização condicional de estoque |
| Lista e cancelamento de reservas | ✅ | ✅ | Apenas dono da reserva; estoque restaurado |
| Área de favoritos | ✅ | ✅ | JWT, associação Usuário × Evento |
| Perfil / cidade preferida | ✅ | ✅ | Persistência em banco |
| Seu Ritmo: seleção de gêneros | ✅ | ✅ | Ranking por Strategy |
| Compatibilidade com artistas | ✅ | ✅ | Artistas declarados/obtidos mediante autorização |
| Spotify (OAuth PKCE) | Código base | Não necessário ao login OAuth de front | Depende de registrar app e permissão da plataforma |
| Apple Music / MusicKit | Planejado | Planejado | Requer developer token e autorização |
| Painel admin: locais / eventos / lotes | ✅ | ✅ | Autorização com admin no banco |
| Publicar / despublicar | ✅ | ✅ | Apenas admin |
| Pagamento, reembolso, QR válido | Não | Não | Fora do escopo da simulação; requer integração e segurança de produção |

**Por que “aproximadamente 70%”?** É um indicador de cobertura dos principais fluxos definidos para a entrega, **não** um percentual calculado automaticamente a partir de linhas de código, testes ou esforço restante. O sistema continua acadêmico, sem transações financeiras reais.

## Restrições conhecidas

- Os dados da semente são inventados e não representam uma agenda pública verificada.
- O app não integra agenda de produtores terceiros de forma automática.
- A autorização Spotify exige credenciais oficiais e configurações corretas. Em 2026, o modo de desenvolvimento exige Premium do proprietário do app e limita a cinco usuários autorizados ([fonte oficial](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)).
- MusicKit e pagamento real não estão implementados.
- Não é uma arquitetura de produção escalável: faltam migrações versionadas, testes de integração completos, política de taxas por lote, logs estruturados, observabilidade e deploy.
- Alterações na tabela `orders` (novo status) e `events` (campo performers) exigem **banco de desenvolvimento novo ou migração planejada**. Não rode `sync({force:true})` em dados reais.

## Passos para prova funcional

1. Instale dependências das duas aplicações, configure `.env` e rode MySQL.
2. Crie um banco novo chamado `alfred_db` e rode o seed.
3. Crie uma conta admin separada com o comando documentado no README.
4. Cadastre um local, evento e lote como admin; publique.
5. Crie conta normal e entre. Selecione um evento, simule a reserva e veja o estoque baixar.
6. Cancele e veja o estoque restaurado. Confira favoritos, perfil e recomendações.
7. Mostre diagrama, arquivo de Strategy, orderService e relatórios dos testes no terminal.

## Pendências após a entrega

- Integração de pagamentos verdadeira com checkout e webhooks idempotentes.
- Geração segura de ingresso QR e verificação na portaria.
- Apple Music real e sincronização musical autorizada/controle de expiração.
- Perfis específicos por organizador (atualmente admins globais).
- Migrações, testes de integração com banco real e automação CI/CD.
