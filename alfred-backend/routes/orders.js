const router=require('express').Router();
const {sequelize}=require('../models');
const auth=require('../middlewares/auth');
const asyncHandler=require('../middlewares/asyncHandler');
const {createOrderService}=require('../services/orderService');
const ticketRepository=require('../repositories/ticketRepository');
const orderRepository=require('../repositories/orderRepository');
const service=createOrderService({ticketRepository,orderRepository,transactionManager:{run:callback=>sequelize.transaction(callback)}});
router.use(auth);
router.get('/',asyncHandler(async(req,res)=>res.json({success:true,data:await service.list(req.user.id)})));
router.post('/demo',asyncHandler(async(req,res)=>{
  const order=await service.reserve({userId:req.user.id,ticketLotId:Number(req.body.ticketLotId),quantity:Number(req.body.quantity)});
  res.status(201).json({success:true,data:order,message:'Reserva simulada. Não é ingresso válido.'});
}));
router.patch('/:id/cancel',asyncHandler(async(req,res)=>{
  const result=await service.cancel({userId:req.user.id,orderId:Number(req.params.id)});
  res.json({success:true,data:result,message:'Reserva simulada cancelada e estoque devolvido.'});
}));
module.exports=router;
