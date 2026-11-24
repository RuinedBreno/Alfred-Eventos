const { randomUUID } = require('node:crypto');
const { Payment, Ticket, Order, User, sequelize } = require('../models');
const lots = require('../repositories/ticketRepository');
const { AppError } = require('./errors');

function gateway() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
    throw new AppError('O organizador ainda precisa configurar o pagamento.', 503);
  return require('stripe')(process.env.STRIPE_SECRET_KEY, {timeout:10000});
}

async function issue(order, transaction) {
  await Ticket.bulkCreate(Array.from({length:order.quantity}, () => ({
    orderId:order.id, code:randomUUID()
  })), {transaction});
  await order.update({status:'CONFIRMED'}, {transaction});
}

async function checkout({userId, ticketLotId, quantity, requestKey}, getGateway=gateway) {
  if (!Number.isSafeInteger(ticketLotId) || !Number.isInteger(quantity) ||
      quantity < 1 || quantity > 6 || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey))
    throw new AppError('Selecione um lote e de 1 a 6 ingressos.');
  return sequelize.transaction(async transaction => {
    await User.findByPk(userId, {transaction,lock:true});
    const previous = await Payment.findOne({where:{userId,requestKey},include:['order'],transaction});
    if (previous) {
      if (previous.order.quantity !== quantity || previous.order.ticketLotId !== ticketLotId)
        throw new AppError('Identificador já usado em outro pedido.',409);
      const session = previous.order.status === 'PENDING' ? await getGateway().checkout.sessions.retrieve(previous.sessionId) : null;
      return {orderId:previous.orderId,url:session?.url};
    }
    const lot = await lots.findLot(ticketLotId,transaction);
    if (!lot?.event?.isPublished || new Date(lot.event.startAt) <= new Date())
      throw new AppError('Evento indisponível.',404);
    const cents = Math.round(Number(lot.price)*100);
    const stripe = cents ? getGateway() : null;
    if (!await lots.reduceStock(ticketLotId,quantity,transaction))
      throw new AppError('Estoque insuficiente.',409);
    const order = await Order.create({userId,ticketLotId,eventId:lot.eventId,quantity,total:(cents*quantity/100).toFixed(2),status:'PENDING'}, {transaction});
    const expiresAt = new Date(Date.now()+35*60000);
    const payment = await Payment.create({orderId:order.id,userId,requestKey,expiresAt},{transaction});
    if (!stripe) {
      await issue(order,transaction);
      return {orderId:order.id};
    }
    const wallet = new URL('/meus-ingressos',process.env.FRONTEND_URL || 'http://127.0.0.1:5173').href;
    const session = await stripe.checkout.sessions.create({
      mode:'payment',payment_method_types:['card'],expires_at:Math.floor(expiresAt.getTime()/1000),
      success_url:wallet,cancel_url:wallet,client_reference_id:String(order.id),
      line_items:[{quantity,price_data:{currency:'brl',unit_amount:cents,product_data:{name:lot.event.title}}}]
    }, {idempotencyKey:'alfred-'+order.id+'-'+requestKey});
    await payment.update({sessionId:session.id},{transaction});
    return {orderId:order.id,url:session.url};
  });
}

async function settle(type,session) {
  if (!['checkout.session.completed','checkout.session.expired'].includes(type)) return;
  await sequelize.transaction(async transaction => {
    const payment = await Payment.findOne({where:{sessionId:session.id},transaction,lock:true});
    if (!payment) return;
    const order = await Order.findByPk(payment.orderId,{transaction,lock:true});
    if (order.status !== 'PENDING') return;
    if (type === 'checkout.session.expired') {
      await lots.restoreStock(order.ticketLotId,order.quantity,transaction);
      await order.update({status:'CANCELLED'},{transaction});
    } else if (session.payment_status === 'paid' && session.currency === 'brl' &&
               session.amount_total === Math.round(Number(order.total)*100) && session.client_reference_id === String(order.id)) {
      await issue(order,transaction);
    } else throw new AppError('Dados de pagamento divergentes.',409);
  });
}

async function webhook(req,res,next) {
  let stripe;
  try { stripe=gateway(); } catch(e) {return next(e);}
  let event;
  try { event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return res.sendStatus(400); }
  try { await settle(event.type,event.data.object);res.sendStatus(200); } catch(e) {next(e);}
}
async function resume(userId,orderId){
 const payment=await Payment.findOne({where:{userId,orderId},include:['order']});
 if(!payment)throw new AppError('Pedido indisponível.',404);
 if(payment.order.status!=='PENDING')return {};
 const session=await gateway().checkout.sessions.retrieve(payment.sessionId);
 if(session.status==='open')return {url:session.url};
 if(session.status==='complete')await settle('checkout.session.completed',session);
 if(session.status==='expired')await settle('checkout.session.expired',session);
 return {};
}
module.exports={checkout,webhook,settle,resume};
