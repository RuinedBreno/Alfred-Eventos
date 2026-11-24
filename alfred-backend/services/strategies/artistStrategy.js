// Strategy 2: compara artistas autorizados ou informados, sem pedir credenciais ao backend.
module.exports={name:'artistas',score(event,profile){
  const names=new Set((profile.artists||[]).map(x=>String(x).toLowerCase().trim()).filter(Boolean));
  const performers=Array.isArray(event.performers)?event.performers:[];
  if(!names.size || !performers.length)return 0;
  const hits=performers.filter(x=>names.has(String(x).toLowerCase().trim())).length;
  return Math.min(30,Math.round(30*hits/Math.max(1,names.size)));
}};
