const {test} = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const {randomUUID} = require('node:crypto');
const {User, Venue, Event, TicketLot} = require('../models');

test('empresa publica, altera a publicação e cria lotes somente na própria agenda', async t => {
  process.env.JWT_SECRET = randomUUID();
  const {generateToken} = require('../config/jwt');
  const app = express();
  app.use(express.json(), require('../routes/admin'));
  app.use((err,req,res,next)=>res.status(err.status || err.statusCode || 500).end());
  const records = [];
  t.mock.method(User,'findByPk',async id=>({id,cnpj:id===4?null:'00000000E08G12',isOrganizer:id!==3}));
  t.mock.method(Venue,'findByPk',async ()=>({id:1}));
  t.mock.method(Event,'create',async data=>{
    const event={...data,id:1,update:async changes=>Object.assign(event,changes)};
    records.push(event);
    return event;
  });
  const matches=(record,where)=>Object.entries(where).every(([k,v])=>String(record[k])===String(v));
  t.mock.method(Event,'findOne',async ({where})=>records.find(r=>matches(r,where)));
  t.mock.method(Event,'findAll',async ({where})=>records.filter(r=>matches(r,where)));
  t.mock.method(TicketLot,'create',async data=>data);
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  function request(user,path,method='GET',body){
    return fetch('http://127.0.0.1:'+server.address().port+path,{method,
      headers:{authorization:'Bearer '+generateToken({id:user}),'content-type':'application/json'},
      body:JSON.stringify(body)});
  }
  const event={title:'Mostra cultural',description:'Encontro de artistas locais',category:'cultura',
    startAt:'2027-05-10T12:00:00Z',venueId:1,organizerId:2,isPublished:false};
  assert.equal((await request(1,'/events','POST',event)).status,201);
  assert.equal(records[0].organizerId,1);
  assert.deepEqual((await (await request(2,'/events')).json()).data,[]);
  assert.equal((await request(4,'/events')).status,403);
  assert.equal((await request(3,'/events')).status,403);
  assert.equal((await request(1,'/reports')).status,403);
  assert.equal((await request(2,'/events/1','PATCH',event)).status,404);
  for(const [path,method,data,ok] of [
    ['/events/1/publication','PATCH',{isPublished:true},200],
    ['/events/1/lots','POST',{name:'Livre',price:0,available:10},201]
  ]){
    assert.equal((await request(2,path,method,data)).status,404);
    assert.equal((await request(1,path,method,data)).status,ok);
  }
  assert.equal(records[0].isPublished,true);
});
