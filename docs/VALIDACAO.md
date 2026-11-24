# Validação do Alfred em 23/11/2026

A verificação usou bancos de teste locais, requisições HTTP entre a aplicação e a API e um navegador Chromium headless. A aplicação consultou o banco durante o teste de interface.

| Área | Procedimento | Resultado observado |
|---|---|---|
| Instalação | Instalação pelas versões travadas, migração, carga de demonstração e segunda migração | Estrutura criada no MySQL Community 8.4.9 e no MariaDB 11.8.9. O seed cadastrou 16 eventos e 10 locais. |
| Atualização de esquema | Banco de teste com conta, reserva, enum antigo de pedidos e coluna curta de imagem | A migração preservou a conta e a reserva e permitiu gravar os novos campos no MySQL 8.4.9. |
| Catálogo do IBGE | Importação repetida da cópia oficial | 5.571 municípios e 27 UFs. A busca por Joinville retornou SC. |
| Unidade | 13 testes de serviços, regras de reserva, Strategy e validação de URLs | 13 aprovados. |
| Contas e privacidade | Cadastro, login, edição, consulta pública, seguidores, bloqueio, desbloqueio e perfil privado | A conta bloqueada perdeu acesso e o perfil privado restringiu as publicações. |
| Moments e moderação | Envio de PNG, leitura da foto convertida em JPEG, curtida, comentário, denúncia e decisão administrativa | Dados persistidos e denúncia removida pelo painel administrativo via API. |
| Organização | Cadastro de local, evento, lote e retirada de publicação | A consulta pública do evento despublicado retornou 404. |
| Reservas | Reserva simulada e cancelamento | O estoque voltou ao valor inicial. |
| Emissão gratuita | Duas requisições simultâneas com a mesma chave para comprar dois ingressos | Um pedido, duas unidades descontadas e dois códigos individuais diferentes. |
| Entrada | Consulta de QR na carteira, tentativa por usuário comum, validação pelo organizador e repetição | QR gerado. A API devolveu 403 ao usuário comum, aceitou a primeira leitura autorizada e devolveu 409 na repetição. |
| Pagamento | Cliente Stripe substituído por um provedor de teste na criação de sessão. Confirmação e expiração enviadas por HTTP com assinatura de teste, duas vezes cada | Preço em centavos calculado no servidor. A confirmação emitiu uma vez e a expiração restaurou o estoque uma vez. |
| Navegador | Formulários de cadastro e login, filtro gratuito no Radar, emissão, abertura do QR, recarga da carteira e publicação de foto pela interface | Fluxo concluído no Chromium sem exceções de JavaScript observadas. |
| Dependências e build | npm ci, build de produção do Vue e npm audit nas pastas de frontend e backend | Build concluído. As duas auditorias retornaram zero vulnerabilidades conhecidas naquele momento. |

A verificação do checkout pago cobriu o código do Alfred com respostas controladas. Autorização de cartão pela Stripe, login com Spotify e Apple Music, identificação do município por GPS em um dispositivo físico e resultado do SonarCloud dependem de homologação externa. A execução local de npm audit verifica dependências e tem finalidade diferente da análise de código pelo Sonar. A aplicação não foi publicada durante esta revisão.

## Reproduzir

Na pasta do backend, `npm test` roda os testes unitários. Para os testes de integração, use um banco exclusivo, por exemplo `alfred_test`. Configure o backend com esse `DB_NAME`, rode a migração, o seed e a importação offline seguindo o README. Os testes criam contas, eventos, pedidos e ingressos nesse banco.

```bash
ALFRED_TEST_DATABASE=alfred_test npm run test:integration
```

No frontend, rode `npm run build`. Para repetir o fluxo visual, suba backend e frontend usando o banco de testes e os endereços padrão. O cenário visual usa o lote gratuito 119 do evento 11 da carga de demonstração. Na pasta `qa`, execute:

```bash
npm ci
npx playwright install chromium
ALFRED_E2E=1 npm test
```

A suíte de navegador cria uma conta por execução. Em Linux com um Chromium já instalado, a variável opcional `CHROMIUM_EXECUTABLE` indica o executável.

Para uma nova análise Sonar, use a organização, a chave de projeto e a credencial de análise do repositório da disciplina. O arquivo `sonar-project.properties` identifica as pastas de código. Ajuste `sonar.projectKey` ao identificador já cadastrado antes de enviar uma análise.
