const genreStrategy=require('./strategies/genreStrategy');
const artistStrategy=require('./strategies/artistStrategy');
const interestStrategy=require('./strategies/interestStrategy');
const locationStrategy=require('./strategies/locationStrategy');
const popularityStrategy=require('./strategies/popularityStrategy');
// OCP/LSP: nova estratégia entra no array e segue a mesma interface score(), sem reescrever o ranking.
const favoritesStrategy={name:"favoritos",score:(event,profile)=>profile.likedCategories?.includes(event.category)?5:0};
function createRecommendationService(strategies=[genreStrategy,artistStrategy,interestStrategy,locationStrategy,popularityStrategy,favoritesStrategy]) {
  return {rank(events,profile){return events.map(event=>{
    const breakdown={};
    for(const strategy of strategies){
      const score=strategy.score(event,profile);
      if(!Number.isFinite(score)||score<0)throw new Error('Estratégia de recomendação inválida.');
      breakdown[strategy.name]=score;
    }
    const score=Math.min(100,Math.round(Object.values(breakdown).reduce((a,b)=>a+b,0)));
    return {event,score,breakdown};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||new Date(a.event.startAt)-new Date(b.event.startAt));}};
}
module.exports={createRecommendationService};
