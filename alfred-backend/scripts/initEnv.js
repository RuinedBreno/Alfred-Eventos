const fs=require('node:fs');
const path=require('node:path');
const {randomBytes}=require('node:crypto');
const filename=path.join(__dirname,'../.env');
try{
 const example=fs.readFileSync(path.join(__dirname,'../.env.example'),'utf8');
 fs.writeFileSync(filename,example.replace('ESCOLHA_UM_SEGREDO_FORTE_E_LONGO',randomBytes(48).toString('hex')),{flag:'wx',mode:0o600});
 console.log('Arquivo .env criado. Ajuste DB_USER e DB_PASSWORD para sua instalação.');
}catch(error){
 if(error.code!=='EEXIST')throw error;
 console.log('O arquivo .env já existe. Confira DB_* e JWT_SECRET antes de continuar.');
}
