const router=require('express').Router();
const {body,validationResult}=require('express-validator');
const {User,Favorite,Event,Venue,TicketLot}=require('../models');
const {publicUser}=require('../services/userPublic');
const auth=require('../middlewares/auth');
const asyncHandler=require('../middlewares/asyncHandler');
const {isSafeImageUrl}=require('../services/safeUrl');
const {INTERESTS:permittedInterests}=require('../services/interests');
const rules=[
 body('preferredCity').optional({nullable:true}).isString().trim().isLength({max:90}),
 body('fullName').optional().isString().trim().isLength({min:2,max:120}),
 body('bio').optional().isString().trim().isLength({max:500}),
 body('avatarUrl').optional({nullable:true}).custom(v=>!v||isSafeImageUrl(v)),
 body('showCity').optional().isBoolean(),
 body('isPrivate').optional().isBoolean(),
 body('interests').optional().isArray({max:20}),
 body('interests.*').optional().isIn(permittedInterests),
 body('musicGenres').optional().isArray({max:20}),
 body('musicGenres.*').optional().isIn(require('../services/interests').GENRES),
 body('musicArtists').optional().isArray({max:20}),
 body('musicArtists.*').optional().isString().isLength({min:1,max:100})
];
router.use(['/profile','/favorites'],auth);
router.patch('/profile',rules,asyncHandler(async(req,res)=>{
 if(!validationResult(req).isEmpty())return res.status(400).json({success:false,message:'Corrija os campos do perfil.'});
 const user=await User.findByPk(req.user.id);
 if(!user)return res.status(404).json({success:false,message:'Usuário não encontrado.'});
 const allowed=['preferredCity','fullName','showCity','bio','avatarUrl','isPrivate','interests','musicGenres','musicArtists'];
 const change={};for(const key of allowed)if(Object.hasOwn(req.body,key))change[key]=req.body[key];
 if(Object.hasOwn(req.body,'avatarPhoto')){
  if(!req.body.avatarPhoto)return res.status(400).json({success:false,message:'Escolha uma imagem válida.'});
  change.avatarUrl=await require('../services/photo').preparePhoto(req.body.avatarPhoto,256);
 }
 await user.update(change);
 res.json({success:true,data:publicUser(user)});
}));
router.get('/favorites',asyncHandler(async(req,res)=>{
 const favorites=await Favorite.findAll({where:{userId:req.user.id},include:[{model:Event,as:'event',include:[{model:Venue,as:'venue'},{model:TicketLot,as:'lots'}]}],order:[['createdAt','DESC']]});
 res.json({success:true,data:favorites});
}));
router.post('/favorites/:eventId',asyncHandler(async(req,res)=>{
 const eventId=Number(req.params.eventId);
 if(!Number.isSafeInteger(eventId)||eventId<1)return res.status(400).json({success:false,message:'Evento inválido.'});
 const event=await Event.findOne({where:{id:eventId,isPublished:true}});
 if(!event)return res.status(404).json({success:false,message:'Evento não encontrado.'});
 await Favorite.findOrCreate({where:{eventId,userId:req.user.id}});
 res.status(201).json({success:true,message:'Evento salvo.'});
}));
router.delete('/favorites/:eventId',asyncHandler(async(req,res)=>{
 await Favorite.destroy({where:{eventId:req.params.eventId,userId:req.user.id}});
 res.json({success:true,message:'Evento removido dos favoritos.'});
}));
module.exports=router;
