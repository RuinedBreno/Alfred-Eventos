const test=require('node:test');
const assert=require('node:assert/strict');
const {createOrderService}=require('../services/orderService');
const transactionManager={run:callback=>callback({test:true})};
function setup(stock=3){
  const state={stock,orders:[],cancelled:false};
  const ticketRepository={
    findLot: async()=>({id:1,eventId:2,price:'50.90',event:{isPublished:true,startAt:'2030-01-01'}}),
    reduceStock:async(id,qty)=>{if(state.stock<qty)return false;state.stock-=qty;return true},
    restoreStock:async(id,qty)=>{state.stock+=qty}
  };
  const orderRepository={
    create:async data=>{const row={id:1,...data};state.orders.push(row);return row},
    findForUser:async(id,userId)=>state.orders.find(x=>x.id===id&&x.userId===userId),
    setCancelled:async()=>{if(state.cancelled)return false;state.cancelled=true;return true},
    listForUser:async(userId)=>state.orders.filter(x=>x.userId===userId)
  };
  return {state,service:createOrderService({ticketRepository,orderRepository,transactionManager,clock:()=>new Date('2029-01-01')})};
}
test('Reserva calcula em centavos e abate estoque',async()=>{
  const {state,service}=setup();const order=await service.reserve({userId:7,ticketLotId:1,quantity:2});
  assert.equal(order.total,'101.80');assert.equal(state.stock,1);
});
test('Impede estoque negativo com conflito 409',async()=>{
  const {service}=setup(1);
  await assert.rejects(service.reserve({userId:7,ticketLotId:1,quantity:2}),{status:409});
});
test('Cancelamento devolve estoque uma vez',async()=>{
  const {service,state}=setup();await service.reserve({userId:7,ticketLotId:1,quantity:2});
  await service.cancel({userId:7,orderId:1});assert.equal(state.stock,3);
  await assert.rejects(service.cancel({userId:7,orderId:1}),{status:409});
});
test('Impede cancelamento por outro usuário',async()=>{
  const {service,state}=setup();await service.reserve({userId:7,ticketLotId:1,quantity:1});
  await assert.rejects(service.cancel({userId:8,orderId:1}),{status:404});assert.equal(state.stock,2);
});
test('Validação proíbe zero e mais de seis ingressos',async()=>{
  const {service}=setup();
  await assert.rejects(service.reserve({userId:1,ticketLotId:1,quantity:0}),{status:400});
  await assert.rejects(service.reserve({userId:1,ticketLotId:1,quantity:7}),{status:400});
});
