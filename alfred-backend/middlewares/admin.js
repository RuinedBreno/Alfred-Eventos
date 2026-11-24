const {User}=require('../models');
const asyncHandler=require('./asyncHandler');
module.exports=asyncHandler(async(req,res,next)=>{
  const user=await User.findByPk(req.user.id);
  if(!user)return res.status(401).json({success:false,message:'Usuário não encontrado.'});
  if(!user.isAdmin)return res.status(403).json({success:false,message:'Acesso restrito à administração.'});
  next();
});
