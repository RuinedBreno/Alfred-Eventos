# Verificação integrada obrigatória — Alfred 2.0

Execute em banco local de desenvolvimento, nunca diretamente num banco importante.

## Preparação

1. MySQL ativo. Ajuste `DB_*` e um `JWT_SECRET` não padrão em `.env`.
2. `npm run migrate` e depois `npm run seed`; execute ambos sem erros.
3. Opcional: `npm run ibge:import` e confirme busca `/api/cities?q=Join`.
4. `npm run admin:create` com senha forte; use login comum para as demais verificações.
5. Inicialize backend e frontend, verificando requisições no console de rede do navegador.

## Cenários

- [ ] Abrir Home e buscar evento futuro por cidade/categoria.
- [ ] Radar: pesquisar por termo, cidade nova, intervalo de datas, usar geolocalização após consentimento e testar local sem coordenadas.
- [ ] Cadastrar duas contas com interesses; sair/entrar e confirmar persistência no MySQL.
- [ ] Atualizar bio, foto HTTPS, interesses e privacidade; verificar os dados após atualizar a página.
- [ ] Match: selecionar gêneros, comparar ranking por cidade e interesse; confirmar que a pontuação não passa de 100.
- [ ] Adicionar/remover favoritos em evento persistido; verificar após login.
- [ ] Criar evento e lote no admin; tentar reserva DEMO, quantidade acima de estoque e cancelamento duplo; verificar que o estoque nunca fica negativo.
- [ ] Moments: publicar legenda e imagem HTTPS, curtir, comentar e excluir apenas conteúdos próprios.
- [ ] Moments: seguir conta pública, tornar privada, confirmar que uma terceira conta não lê os posts; testar bloqueio bidirecional.
- [ ] Moments: denunciar publicação com outra conta, aceitar/remover pelo admin e confirmar desaparecimento do feed.
- [ ] Wallet: confirmar histórico local e remoto e a advertência de que nenhuma reserva dá direito à entrada.
- [ ] Testar sessão inválida, CORS não autorizado, validação de entradas incorretas, URLs inseguras e uso de endpoints protegidos sem JWT.
- [ ] `npm run build` frontend, `npm test` e `npm run check` backend.

## Limites e riscos antes de publicação

- Falta de testes E2E, teste real de transações em MySQL, migrações reversíveis e sistema de revisão de foto hospedada.
- Dados de exemplo continuam completamente fictícios.
- Não ativar pagamentos ou ingressos reais com base no fluxo de demonstração.
- Adicionar limites de requisição distribuídos, observabilidade, política de privacidade, LGPD e revisão de segurança antes de qualquer lançamento público.
