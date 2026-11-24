const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const jwt=require('jsonwebtoken');
const envPath=path.resolve(__dirname,'../../alfred-frontend/.env.local');
function configure(provider,args){
 const origin='http://127.0.0.1:5173';
 if(provider==='spotify' && args.length===1 && /^[a-z0-9]{32}$/i.test(args[0])){
  return {VITE_SPOTIFY_CLIENT_ID:args[0],VITE_SPOTIFY_REDIRECT_URI:origin+'/spotify/callback'};
 }
 if(provider==='apple' && args.length===3 && args.slice(0,2).every(x=>/^[A-Z0-9]{10}$/.test(x))){
  const [team,keyId,filename]=args;
  const key=fs.readFileSync(filename.replace(/^~\//,os.homedir()+'/'),'utf8');
  const token=jwt.sign({origin:[origin]},key,{algorithm:'ES256',keyid:keyId,issuer:team,expiresIn:'90d'});
  return {VITE_APPLE_MUSIC_DEVELOPER_TOKEN:token};
 }
 throw Error('Use spotify CLIENT_ID ou apple TEAM_ID KEY_ID "/caminho/para/chave.p8".');
}
try{
 const settings=configure(process.argv[2],process.argv.slice(3));
 let content=fs.existsSync(envPath)?fs.readFileSync(envPath,'utf8'):'';
 for(const [key,value] of Object.entries(settings)){
  content=content.split(/\r?\n/).filter(line=>!new RegExp('^\\s*(?:export\\s+)?'+key+'\\s*=').test(line)).join('\n').trimEnd()+'\n'+key+'='+value+'\n';
 }
 const temp=envPath+'.'+process.pid+'.tmp';
 fs.writeFileSync(temp,content,{flag:'wx',mode:0o600});
 fs.renameSync(temp,envPath);
 console.log('Configuração salva. Reinicie o Vite e abra Seu ritmo em http://127.0.0.1:5173.'+(process.argv[2]==='apple'?' Repita este comando em 90 dias para renovar o token.':''));
}catch(e){console.error(e.message);process.exitCode=1}
