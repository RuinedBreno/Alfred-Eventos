require('dotenv').config();
const {sequelize,User}=require('../models');
(async()=>{
 await sequelize.authenticate();
 // Adição não destrutiva de colunas do perfil para quem já tinha a versão 0.7.
 const qi=sequelize.getQueryInterface();
 if(await qi.tableExists('users')){
  const current=await qi.describeTable('users');
  if(current.avatar_url && !current.avatar_url.type.toUpperCase().includes('MEDIUMTEXT')){
   await qi.changeColumn('users','avatar_url',{type:User.rawAttributes.avatarUrl.type,allowNull:true});
  }
  for(const [name,definition] of Object.entries(User.rawAttributes)){
   if(!Object.hasOwn(current,definition.field||name) && ['bio','showCity','avatarUrl','isPrivate','interests','musicGenres','musicArtists'].includes(name)){
    // Colunas novas e opcionais para contas antigas: evita DEFAULT JSON inválido em algumas versões do MySQL.
    // Novos cadastros recebem os defaults do modelo; contas antigas são lidas com fallback no serviço.
    await qi.addColumn('users',definition.field||name,{type:definition.type,allowNull:true});
    console.log(`Coluna adicionada: users.${definition.field||name}`);
   }
  }
 }
 if(await qi.tableExists('users') && !(await qi.describeTable('users')).is_organizer){
  await qi.addColumn('users','is_organizer',User.rawAttributes.isOrganizer);
 }
 if(await qi.tableExists('users') && !(await qi.describeTable('users')).cnpj){
  await qi.addColumn('users','cnpj',User.rawAttributes.cnpj);
 }
 if(await qi.tableExists('events') && !(await qi.describeTable('events')).organizer_id){
  await qi.addColumn('events','organizer_id',require('../models').Event.rawAttributes.organizerId);
 }
 if(await qi.tableExists('posts')){
  const columns=await qi.describeTable('posts');
  if(!columns.image_url.type.toUpperCase().includes('MEDIUMTEXT')) await qi.changeColumn('posts','image_url',{type:require('sequelize').DataTypes.TEXT('medium'),allowNull:true});
 }
 if(await qi.tableExists('orders')){
   const {Order}=require('../models');
   const columns=await qi.describeTable('orders');
   if(!columns.status.type.includes('CONFIRMED')) await qi.changeColumn('orders','status',Order.rawAttributes.status);
 }
 await sequelize.sync();
 console.log('Estrutura conferida. As tabelas e dados existentes foram preservados.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>sequelize.close());
