const router=require('express').Router();
const {sequelize,Event,Venue,TicketLot,Order,User,PostReport,Post}=require('../models');
const {Op}=require('sequelize');
const {body,validationResult}=require('express-validator');
const auth=require('../middlewares/auth');
const admin=require('../middlewares/admin');
const asyncHandler=require('../middlewares/asyncHandler');
const {AppError}=require('../services/errors');
router.use(auth);
const eventManager = asyncHandler(async (req, res, next) => {
  const account = await User.findByPk(req.user.id);
  if (!account || !(account.isAdmin || (account.isOrganizer && account.cnpj))) {
    return res.status(403).json({success:false,message:'Acesso restrito à gestão de eventos.'});
  }
  req.eventScope = account.isAdmin ? {} : {organizerId:account.id};
  next();
});
const managedEvent = req => Event.findOne({where:{...req.eventScope,id:req.params.id}});
const categories=['cinema','shows','baladas','teatro','danca','cultura'];
const validate=(req,res,next)=>{
  const errors=validationResult(req);
  return errors.isEmpty()?next():res.status(400).json({success:false,message:'Corrija os dados enviados.',errors:errors.array()});
};
const eventRules=[
  body('title').isString().trim().isLength({min:3,max:180}),
  body('description').isString().trim().isLength({min:10,max:5000}),
  body('category').isIn(categories),
  body('startAt').isISO8601(),
  body('venueId').isInt({min:1}),
  body('genres').optional().isArray({max:20}),
  body('performers').optional().isArray({max:20}),
  body('isPublished').optional().isBoolean(),
  body('accent').optional().isString().isLength({max:30})
];
const pickEvent=b=>({title:b.title,description:b.description,category:b.category,startAt:b.startAt,endAt:b.endAt||null,venueId:Number(b.venueId),genres:(b.genres||[]).map(String),performers:(b.performers||[]).map(String),isPublished:b.isPublished===undefined?true:b.isPublished,accent:b.accent||'violet'});
const venueRules=[body('name').isString().trim().isLength({min:2,max:130}),body('city').isString().trim().isLength({min:2,max:90}),body('state').matches(/^[A-Z]{2}$/),body('address').isString().trim().isLength({min:3,max:255}),body('latitude').optional({nullable:true,checkFalsy:true}).isFloat({min:-90,max:90}),body('longitude').optional({nullable:true,checkFalsy:true}).isFloat({min:-180,max:180})];
router.get('/stats',admin,asyncHandler(async(req,res)=>{
  const [events,venues,users,reservations]=await Promise.all([Event.count(),Venue.count(),User.count(),Order.count({where:{status:{[Op.in]:['DEMO','PENDING','CONFIRMED']}}})]);
  res.json({success:true,data:{events,venues,users,reservations}});
}));
router.get('/events',eventManager,asyncHandler(async(req,res)=>res.json({success:true,data:await Event.findAll({where:req.eventScope,include:[{model:Venue,as:'venue'},{model:TicketLot,as:'lots'}],order:[['startAt','DESC']],limit:250})})));
router.post('/venues',eventManager,venueRules,validate,asyncHandler(async(req,res)=>{
  const venue=await Venue.create({name:req.body.name,city:req.body.city,state:req.body.state,address:req.body.address,latitude:req.body.latitude===undefined||req.body.latitude===''?null:Number(req.body.latitude),longitude:req.body.longitude===undefined||req.body.longitude===''?null:Number(req.body.longitude)});
  res.status(201).json({success:true,data:venue});
}));
router.patch('/venues/:id',admin,venueRules,validate,asyncHandler(async(req,res)=>{
  const venue=await Venue.findByPk(req.params.id);
  if(!venue)throw new AppError('Local não encontrado.',404);
  await venue.update({name:req.body.name,city:req.body.city,state:req.body.state,address:req.body.address,latitude:req.body.latitude===undefined||req.body.latitude===''?null:Number(req.body.latitude),longitude:req.body.longitude===undefined||req.body.longitude===''?null:Number(req.body.longitude)});
  res.json({success:true,data:venue});
}));
router.post('/events',eventManager,eventRules,validate,asyncHandler(async(req,res)=>{
  const venue=await Venue.findByPk(req.body.venueId);
  if(!venue)throw new AppError('Local não encontrado.',404);
  const event=await Event.create({...pickEvent(req.body),organizerId:req.user.id});
  res.status(201).json({success:true,data:event});
}));
router.patch('/events/:id',eventManager,eventRules,validate,asyncHandler(async(req,res)=>{
  const event=await managedEvent(req);
  if(!event)throw new AppError('Evento não encontrado.',404);
  if(!await Venue.findByPk(req.body.venueId))throw new AppError('Local não encontrado.',404);
  await event.update(pickEvent(req.body));
  res.json({success:true,data:event});
}));
router.patch('/events/:id/publication',eventManager,body('isPublished').isBoolean(),validate,asyncHandler(async(req,res)=>{
  const event=await managedEvent(req);
  if(!event)throw new AppError('Evento não encontrado.',404);
  await event.update({isPublished:req.body.isPublished});
  res.json({success:true,data:{id:event.id,isPublished:event.isPublished}});
}));
router.post('/events/:id/lots',eventManager,[
  body('name').isString().trim().isLength({min:2,max:60}),
  body('price').isFloat({min:0,max:999999}),
  body('available').isInt({min:0,max:100000})
],validate,asyncHandler(async(req,res)=>{
  const event=await managedEvent(req);
  if(!event)throw new AppError('Evento não encontrado.',404);
  const lot=await TicketLot.create({eventId:event.id,name:req.body.name,price:Number(req.body.price).toFixed(2),available:Number(req.body.available)});
  res.status(201).json({success:true,data:lot});
}));
router.patch('/lots/:id',admin,[
  body('name').isString().trim().isLength({min:2,max:60}),
  body('price').isFloat({min:0,max:999999}),
  body('available').isInt({min:0,max:100000})
],validate,asyncHandler(async(req,res)=>{
  // Não alterar estoque manualmente enquanto existem reservas: uso acadêmico controlado.
  const lot=await TicketLot.findByPk(req.params.id);
  if(!lot)throw new AppError('Lote não encontrado.',404);
  await lot.update({name:req.body.name,price:Number(req.body.price).toFixed(2),available:Number(req.body.available)});
  res.json({success:true,data:lot});
}));
router.get('/reports',admin,asyncHandler(async(req,res)=>{
 const reports=await PostReport.findAll({where:{status:'OPEN'},include:[{model:Post,as:'post',attributes:['id','caption','authorId']}],order:[['createdAt','DESC']],limit:100});
 res.json({success:true,data:reports});
}));
router.patch('/reports/:id',admin,body('status').isIn(['DISMISSED','REMOVED']),validate,asyncHandler(async(req,res)=>{
 const report=await PostReport.findByPk(req.params.id);
 if(!report)throw new AppError('Denúncia não encontrada.',404);
 if(req.body.status==='REMOVED'){
  const post=await Post.findByPk(report.postId);
  if(post){const {PostLike,PostComment}=require('../models');await sequelize.transaction(async t=>{
   await PostLike.destroy({where:{postId:post.id},transaction:t});
   await PostComment.destroy({where:{postId:post.id},transaction:t});
   await PostReport.update({status:'REMOVED'},{where:{postId:post.id},transaction:t});
   await post.destroy({transaction:t});
  });}
 }else await report.update({status:'DISMISSED'});
 res.json({success:true});
}));
module.exports=router;
