# Estado do Alfred 2.0 — versão de trabalho 0.8.0

## Implementado no código

- Preservada a aplicação Vue/Node/Sequelize original e os modelos User, Venue, Event, TicketLot, Order e Favorite.
- Novos modelos State e City, script de importação das cidades do IBGE, endpoint de pesquisa de municípios e campo de cidade digitável no frontend.
- Filtros de data inicial e final na exploração; coordenadas opcionais com validação no painel de locais.
- Datas vencidas corrigidas **somente no seed e no arquivo demonstrativo**; dados já existentes no MySQL com reservas não são sobrescritos por segurança.
- Perfil editável com bio, avatar HTTPS, privacidade, cidade, interesses e gêneros; cadastro com interesses e cidade. O cache local de músicas e reservas é isolado por usuário.
- Strategy adicionada para preferências de categoria, cidade e popularidade por favoritos, além das estratégias anteriores por gêneros e artistas.
- Alfred Moments com feed, postagens, foto HTTPS, comentários, curtidas, seguidores, perfis públicos/privados, bloqueio, denúncias e moderação admin.
- Rotas/visuais para Moments e perfis públicos no frontend.
- Walter/Wallet demonstrativa preservada como histórico de reservas simuladas, explicitamente sem autorização de ingresso.

## Implementado parcialmente / dependências externas

- **Spotify:** PKCE existente da base; o novo código sincroniza com o perfil apenas os nomes dos artistas e gêneros. Não armazena credenciais Spotify no banco. OAuth depende de credenciais, autorização e acesso à API externa.
- **IBGE:** importação desenvolvida, **não executada** neste ambiente; requer internet no servidor e banco MySQL em funcionamento.
- **Rede social:** fotos por link HTTPS; não há upload de binários nem fluxo de aprovação de solicitação a perfis privados (perfis privados antigos seguem visíveis aos seguidores anteriores).
- **Admin:** controle global no protótipo, sem papéis por organizador.
- **Match:** localização por cidade, não cálculo global detalhado de distância para ranking.

## Não implementado — precisa de serviços e desenho adicional

- Apple Music/MusicKit, pagamentos reais e webhooks, documentos fiscais, ingressos/QR Codes válidos, validação na portaria, notificações, armazenamento seguro de imagens, antivírus/moderação automática, solução anti-spam/rate limit distribuído e testes de carga/segurança em produção.
- A criação de reservas continua **DEMO**; não confundir com compras.

## Comprovação local desta entrega

- Testes unitários backend sem banco: **13/13 passaram** (Node.js `--test`).
- Sintaxe dos módulos JS backend verificada com `node --check`.
- Não foi possível fazer `npm install`/`npm run build` Vue por indisponibilidade de rede (`EAI_AGAIN` para registry.npmjs.org).
- Não foi possível executar MySQL, importar IBGE nem executar testes end-to-end de navegação/login/fluxo de reservas.

## Observação sobre a expressão 70%

Os “70%” se referiam à entrega acadêmica histórica. Não foi calculado um percentual real de conclusão do produto final. A implementação em 0.8 adiciona recursos importantes, mas **não é aplicação comercial pronta**.
