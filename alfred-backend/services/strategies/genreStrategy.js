// Strategy 1: contrato score(evento, preferencias) -> 0..50
module.exports={name:'generos',score(event,profile){
  const wanted=new Set((profile.genres||[]).map(x=>String(x).toLowerCase().trim()));
  const tags=Array.isArray(event.genres)?event.genres:[];
  if(!wanted.size || !tags.length)return 0;
  const hits=tags.filter(x=>wanted.has(String(x).toLowerCase().trim())).length;
  return Math.min(50,Math.round(50*hits/Math.max(1,wanted.size)));
}};
