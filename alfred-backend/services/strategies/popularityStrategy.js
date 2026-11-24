// Popularidade é um sinal leve baseado em favoritos, não em cliques falsos.
module.exports={name:'popularidade',score(event){
 const n=Number(event.favoriteCount||0);
 if(!Number.isFinite(n)||n<=0)return 0;
 return Math.min(5,Math.ceil(Math.log2(n+1)*2));
}};
