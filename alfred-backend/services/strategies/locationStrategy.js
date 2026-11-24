module.exports={name:'localidade',score(event,profile){
 const city=String(profile.city||'').trim().toLocaleLowerCase('pt-BR');
 if(!city)return 0;
 return String(event.venue?.city||'').trim().toLocaleLowerCase('pt-BR')===city?5:0;
}};
