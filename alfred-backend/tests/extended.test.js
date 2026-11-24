const test=require('node:test');
const assert=require('node:assert/strict');
const {isSafeImageUrl}=require('../services/safeUrl');
const {createRecommendationService}=require('../services/recommendationService');
const interest=require('../services/strategies/interestStrategy');
const location=require('../services/strategies/locationStrategy');
const popularity=require('../services/strategies/popularityStrategy');
test('URLs inseguras são recusadas nos perfis e momentos',()=>{
 for(const value of ['javascript:alert(1)','http://site.com/a.jpg','data:image/png;base64,AAAA','https://localhost/img','https://u:p@site.com/a.jpg'])assert.equal(isSafeImageUrl(value),false);
 assert.equal(isSafeImageUrl('https://images.example.com/photo.jpg'),true);
});
test('Strategy considera interesses do cadastro e cidade sem anular as originais',()=>{
 const event={id:1,category:'teatro',startAt:'2030-01-01',genres:[],performers:[],venue:{city:'Joinville'}};
 const profile={interests:['teatro'],city:'Joinville',genres:[],artists:[]};
 assert.equal(interest.score(event,profile),10);assert.equal(location.score(event,profile),5);
 const ranked=createRecommendationService().rank([event],profile);
 assert.equal(ranked[0].score,15);
});
test('Strategy ignora interesses e cidades não correspondentes',()=>{
 const event={category:'teatro',venue:{city:'Florianópolis'}};
 assert.equal(interest.score(event,{interests:['cinema']}),0);
 assert.equal(location.score(event,{city:'Joinville'}),0);
});

test('Popularidade acrescenta no máximo cinco pontos a um evento',()=>{
 assert.equal(popularity.score({favoriteCount:0}),0);
 assert.equal(popularity.score({favoriteCount:3}),4);
 assert.equal(popularity.score({favoriteCount:99999}),5);
});
