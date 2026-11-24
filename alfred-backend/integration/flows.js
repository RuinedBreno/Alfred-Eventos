// Execute contra um banco exclusivo para testes, após migrate, seed e ibge:import.
require('dotenv').config();
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const app=require('../app');
const {sequelize,User,Event,TicketLot,Order,Payment}=require('../models');
async function main(){
 if(!process.env.ALFRED_TEST_DATABASE || process.env.ALFRED_TEST_DATABASE!==process.env.DB_NAME)
  throw Error('Informe ALFRED_TEST_DATABASE igual a DB_NAME de um banco exclusivo para teste.');
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))});
 const base='http://127.0.0.1:'+server.address().port+'/api';
 async function call(method,path,status,body,token){
  const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body&&JSON.stringify(body)});
  const result=await res.json();
  assert.equal(res.status,status,method+' '+path+' '+JSON.stringify(result));
  return result;
 }
 try{
  const username='teste_'+randomUUID().slice(0,8),email=username+'@example.com',password=randomUUID();
  await call('POST','/register',201,{username,email,password,fullName:'Teste de integração',interests:['teatro']});
  const {token}=await call('POST','/login',200,{email,password});
  await call('PATCH','/profile',200,{preferredCity:'Joinville',showCity:true},token);
  assert.equal((await call('GET','/users/'+username,200)).data.preferredCity,'Joinville');
  assert.equal((await call('GET','/cities?q=Joinville',200)).data[0].uf,'SC');
  assert.equal((await call('GET','/states',200)).data.length,27);
  const events=(await call('GET','/events',200)).data;
  assert.ok(events.length);
  const event=await Event.create({title:'Evento de integração',description:'Validação acadêmica',startAt:new Date(Date.now()+86400000),category:'teatro',venueId:events[0].venueId});
  const lot=await TicketLot.create({name:'Gratuito',price:0,available:5,eventId:event.id});
  await call('POST','/favorites/'+event.id,201,{},token);
  assert.ok((await call('GET','/recommendations',200,null,token)).data.some(x=>x.event.id===event.id));
  const photo=(await require('sharp')({create:{width:10,height:10,channels:3,background:'red'}}).png().toBuffer()).toString('base64');
  const post=(await call('POST','/social/posts',201,{caption:'Teste de publicação',eventId:event.id,photo},token)).data;
  await call('POST','/social/posts/'+post.id+'/like',200,{},token);
  await call('POST','/social/posts/'+post.id+'/comments',201,{content:'Comentário de teste'},token);
  const feed=(await call('GET','/users/'+username+'/posts',200)).data;
  assert.ok(feed[0].imageUrl.startsWith('data:image/jpeg;base64,'));
  assert.equal(feed[0].comments.length,1);assert.equal(feed[0].likesCount,1);
  const peer='par_'+randomUUID().slice(0,8),peerEmail=peer+'@example.com';
  await call('POST','/register',201,{username:peer,email:peerEmail,password,fullName:'Segundo perfil'});
  const peerToken=(await call('POST','/login',200,{email:peerEmail,password})).token;
  await call('POST','/users/'+username+'/follow',200,{},peerToken);
  assert.equal((await call('GET','/users/'+username,200,null,peerToken)).data.isFollowing,true);
  await call('POST','/social/posts/'+post.id+'/report',201,{reason:'Revisão de integração'},peerToken);
  await call('POST','/users/'+peer+'/block',200,{},token);
  assert.equal((await call('GET','/social/blocked',200,null,token)).data[0].username,peer);
  await call('GET','/users/'+username,404,null,peerToken);
  await call('DELETE','/users/'+peer+'/block',200,null,token);
  await call('PATCH','/profile',200,{isPrivate:true},token);
  assert.equal((await call('GET','/users/'+username,200)).data.canSeePosts,false);

  const order=(await call('POST','/orders/demo',201,{ticketLotId:lot.id,quantity:1},token)).data;
  await call('PATCH','/orders/'+order.id+'/cancel',200,{},token);
  assert.equal((await lot.reload()).available,5);
  const payload={ticketLotId:lot.id,quantity:2,requestKey:randomUUID()};
  const [a,b]=await Promise.all([1,2].map(()=>call('POST','/tickets/checkout',201,payload,token)));
  assert.equal(a.data.orderId,b.data.orderId);assert.equal((await lot.reload()).available,3);
  const wallet=(await call('GET','/orders',200,null,token)).data.find(o=>o.id===a.data.orderId);
  assert.equal(wallet.tickets.length,2);
  assert.notEqual(wallet.tickets[0].code,wallet.tickets[1].code);
  const code=wallet.tickets[0].code;
  assert.ok((await call('GET','/tickets/'+code+'/qr',200,null,token)).data.startsWith('data:image/png;base64,'));
  await call('POST','/tickets/check-in',403,{code,eventId:event.id},token);
  await User.update({isAdmin:true},{where:{username}});
  const reports=(await call('GET','/admin/reports',200,null,token)).data;
  await call('PATCH','/admin/reports/'+reports.find(r=>r.postId===post.id).id,200,{status:'REMOVED'},token);
  const venue=(await call('POST','/admin/venues',201,{name:'Palco de teste',city:'Joinville',state:'SC',address:'Local de teste'},token)).data;
  const newEvent=(await call('POST','/admin/events',201,{title:'Agenda de teste',description:'Criado pelo administrador',category:'cultura',startAt:new Date(Date.now()+86400000).toISOString(),venueId:venue.id},token)).data;
  await call('POST','/admin/events/'+newEvent.id+'/lots',201,{name:'Inteira',price:30,available:20},token);
  await call('PATCH','/admin/events/'+newEvent.id+'/publication',200,{isPublished:false},token);
  await call('GET','/events/'+newEvent.id,404);
  await call('POST','/tickets/check-in',200,{code,eventId:event.id},token);
  await call('POST','/tickets/check-in',409,{code,eventId:event.id},token);
  // Notificações locais assinadas exercitam a mesma entrada HTTP usada pelo provedor.
  process.env.STRIPE_SECRET_KEY='sk_test_fixture';
  process.env.STRIPE_WEBHOOK_SECRET=randomUUID();
  const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY);
  const user=await User.findOne({where:{username}});
  for(const type of ['checkout.session.completed','checkout.session.expired']){
   const sessionId=randomUUID();
   await lot.update({price:'20.50'});
   const fakeGateway=()=>({checkout:{sessions:{create:async(payload)=>{
    assert.equal(payload.line_items[0].price_data.unit_amount,2050);
    return {id:sessionId,url:'https://example.com/test-checkout'};
   }}}});
   const started=await require('../services/checkout').checkout({userId:user.id,ticketLotId:lot.id,quantity:1,requestKey:randomUUID()},fakeGateway);
   assert.equal(started.url,'https://example.com/test-checkout');
   const pending=await Order.findByPk(started.orderId);
   const body=JSON.stringify({type,data:{object:{id:sessionId,payment_status:'paid',currency:'brl',amount_total:2050,client_reference_id:String(pending.id)}}});
   for(let i=0;i<2;i++){
    const signature=stripe.webhooks.generateTestHeaderString({payload:body,secret:process.env.STRIPE_WEBHOOK_SECRET});
    const response=await fetch(base+'/payments/webhook',{method:'POST',headers:{'content-type':'application/json','stripe-signature':signature},body});
    assert.equal(response.status,200);
   }
   assert.equal((await pending.reload()).status,type.endsWith('expired')?'CANCELLED':'CONFIRMED');
   assert.equal((await pending.getTickets()).length,type.endsWith('expired')?0:1);
  }
  assert.equal((await lot.reload()).available,2);
  console.log('Fluxos integrados aprovados.');
 }finally{await new Promise(resolve=>server.close(resolve));await sequelize.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
