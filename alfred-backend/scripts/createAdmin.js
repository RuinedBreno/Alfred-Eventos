require('dotenv').config();
const bcrypt=require('bcryptjs');
const {sequelize,User}=require('../models');
(async()=>{
  const email=process.env.ADMIN_EMAIL, password=process.env.ADMIN_PASSWORD;
  if(!email || !password || password.length<12)throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD (12+ caracteres) no .env.');
  await sequelize.authenticate();
  const existing=await User.findOne({where:{email}});
  if(existing)throw new Error('E-mail já cadastrado. Comando não promove contas existentes.');
  const user=await User.create({email,username:process.env.ADMIN_USERNAME||'organizador',fullName:process.env.ADMIN_NAME||'Organizador Alfred',password:await bcrypt.hash(password,12),isAdmin:true});
  console.log(`Administrador acadêmico criado: ${user.email} (ID ${user.id})`);
})().catch(err=>{console.error(err.message);process.exitCode=1}).finally(()=>sequelize.close());
