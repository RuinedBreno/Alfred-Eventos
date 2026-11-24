# Checklist de evidências para submissão

Faça capturas de tela **somente após executar no seu computador**. O arquivo não inclui capturas simuladas.

- [ ] Terminal backend: `npm test` com testes passando.
- [ ] Terminal frontend: `npm run build` concluído.
- [ ] Página inicial e filtros de seis categorias.
- [ ] Agenda da cidade / futuros eventos de um local.
- [ ] Login como usuário comum.
- [ ] Favoritar evento e ver tela Salvos.
- [ ] Simulação de reserva (HTTP 201) e listagem.
- [ ] Cancelar reserva; conferir disponibilidade devolvida.
- [ ] Usuário normal acessando `GET /api/admin/stats` recebe HTTP 403.
- [ ] Admin cadastrando local, evento e lote no painel.
- [ ] Recomendação por gênero e artista, com ranking.
- [ ] Diagrama Mermaid renderizado no GitHub.
- [ ] `git status` limpo após commit e `git log -1` visível no remoto.
- [ ] GitHub Actions (workflow CI) com os jobs backend e frontend verdes, após o push.

> Atenção: o ambiente em que a atualização foi preparada não teve acesso ao registro NPM nem ao MySQL local do aluno. Apenas os testes unitários do serviço de reservas e de estratégias e checagem de sintaxe backend foram executados aqui; frontend e fluxos integrados **devem ser executados no ambiente do aluno** antes da apresentação.
