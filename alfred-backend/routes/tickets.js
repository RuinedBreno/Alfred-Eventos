const router = require('express').Router();
const QRCode = require('qrcode');
const { Ticket, Order, Event, sequelize } = require('../models');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const run = require('../middlewares/asyncHandler');
const { AppError } = require('../services/errors');
const { checkout } = require('../services/checkout');
router.use(auth);
router.post('/checkout',run(async(req,res)=>{
  const result=await checkout({...req.body,userId:req.user.id});
  res.status(201).json({success:true,data:result});
}));
router.post('/orders/:id/resume',run(async(req,res)=>{
  res.json({success:true,data:await require('../services/checkout').resume(req.user.id,Number(req.params.id))});
}));
router.get('/:code/qr',run(async(req,res)=>{
  const ticket=await Ticket.findOne({where:{code:req.params.code},include:[{model:Order,as:'order',where:{userId:req.user.id,status:'CONFIRMED'}}]});
  if(!ticket) throw new AppError('Ingresso indisponível.',404);
  res.set('Cache-Control','no-store').json({success:true,data:await QRCode.toDataURL(ticket.code)});
}));
router.post('/check-in',admin,run(async(req,res)=>{
  const data=await sequelize.transaction(async transaction=>{
    const ticket=await Ticket.findOne({where:{code:String(req.body.code||'')},transaction,lock:true});
    if(!ticket) throw new AppError('Ingresso desconhecido.',404);
    const order=await Order.findByPk(ticket.orderId,{transaction});
    const event=await Event.findByPk(order.eventId,{transaction});
    if(order.status!=='CONFIRMED'||order.eventId!==Number(req.body.eventId)||!event?.isPublished)
      throw new AppError('Ingresso indisponível para este evento.',409);
    if(ticket.checkedAt) throw new AppError('Este ingresso já foi utilizado.',409);
    await ticket.update({checkedAt:new Date()},{transaction});
    return {event:event.title,checkedAt:ticket.checkedAt};
  });
  res.json({success:true,data});
}));
module.exports=router;
