const test=require('node:test');
const assert=require('node:assert/strict');
const {createRecommendationService}=require('../services/recommendationService');
const genre=require('../services/strategies/genreStrategy');
const artist=require('../services/strategies/artistStrategy');
const e=(genres,performers=[],id=1)=>({id,startAt:'2030-01-01',genres,performers});
test('Ranking combina gêneros e artistas com pesos sem ultrapassar 100 pontos',()=>{
  const result=createRecommendationService().rank([e(['rock'],['Banda Exemplo'])],{genres:['rock'],artists:['Banda Exemplo']});
  assert.equal(result[0].score,80);
  assert.deepEqual(result[0].breakdown,{generos:50,artistas:30,interesses:0,localidade:0,popularidade:0,favoritos:0});
});
test('Sem preferências não inventa compatibilidade',()=>assert.deepEqual(createRecommendationService().rank([e(['pop'])],{genres:[],artists:[]}),[]));
test('Estratégias seguem a mesma interface (LSP) e são extensíveis (OCP)',()=>{
  for(const strategy of [genre,artist])assert.equal(typeof strategy.score,'function');
  const extra={name:'bonus',score:()=>10};
  assert.equal(createRecommendationService([extra]).rank([e([])],{})[0].score,10);
});
test('Estratégias incorretas são rejeitadas',()=>{
  assert.throws(()=>createRecommendationService([{name:'ruim',score:()=>-1}]).rank([e([])],{}),/inválida/);
});
