const router=require('express').Router();
const {Op}=require('sequelize');
const {body,validationResult}=require('express-validator');
const {sequelize,User,Event,Post,PostLike,PostComment,UserFollow,UserBlock,PostReport}=require('../models');
const {summary}=require('../services/userPublic');
const {isSafeImageUrl}=require('../services/safeUrl');
const auth=require('../middlewares/auth'),optionalAuth=require('../middlewares/optionalAuth');
const asyncHandler=require('../middlewares/asyncHandler');
const {AppError}=require('../services/errors');
const requireValid=(req,res,next)=>validationResult(req).isEmpty()?next():res.status(400).json({success:false,message:'Revise os campos enviados.'});
const integer=v=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<1)throw new AppError('Identificador inválido.',400);return n};
async function blocked(a,b){return !!await UserBlock.findOne({where:{[Op.or]:[{blockerId:a,blockedId:b},{blockerId:b,blockedId:a}]}})}
async function canSee(author,viewerId){
 if(!author)return false;
 if(viewerId&&await blocked(viewerId,author.id))return false;
 if(!author.isPrivate||viewerId===author.id)return true;
 return !!(viewerId&&await UserFollow.findOne({where:{followerId:viewerId,followingId:author.id}}));
}
async function requireVisiblePost(postId,viewerId){
 const post=await Post.findByPk(postId,{include:[{model:User,as:'author'},{model:Event,as:'event',attributes:['id','title']} ]});
 if(!post||!await canSee(post.author,viewerId))throw new AppError('Publicação indisponível.',404);
 return post;
}
async function serializePost(post,viewerId){
 const [likes,comments,liked]=await Promise.all([
 PostLike.count({where:{postId:post.id}}),PostComment.findAll({where:{postId:post.id},include:[{model:User,as:'author'}],order:[['createdAt','ASC']],limit:30}),
 viewerId?PostLike.count({where:{postId:post.id,userId:viewerId}}):0
 ]);
 const blocks=viewerId&&comments.length?await UserBlock.findAll({where:{[Op.or]:[{blockerId:viewerId},{blockedId:viewerId}]},attributes:['blockerId','blockedId']}):[];
 const hidden=new Set(blocks.map(b=>b.blockerId===viewerId?b.blockedId:b.blockerId));
 const visibleComments=comments.filter(c=>!hidden.has(c.authorId));
 return {id:post.id,caption:post.caption,imageUrl:post.imageUrl,event:post.event||null,author:summary(post.author),createdAt:post.createdAt,
 likesCount:likes,likedByMe:!!liked,comments:visibleComments.map(c=>({id:c.id,content:c.content,createdAt:c.createdAt,author:summary(c.author),isMine:c.authorId===viewerId}))};
}
router.get('/users/:username',optionalAuth,asyncHandler(async(req,res)=>{
 const user=await User.findOne({where:{username:req.params.username}});
 if(!user||req.user&&await blocked(user.id,req.user.id))throw new AppError('Perfil indisponível.',404);
 const visible=await canSee(user,req.user?.id);
 const [followers,following,isFollowing]=await Promise.all([
 UserFollow.count({where:{followingId:user.id}}),UserFollow.count({where:{followerId:user.id}}),
 req.user?UserFollow.count({where:{followerId:req.user.id,followingId:user.id}}):0
 ]);
 const favorites=visible?await require('../models').Favorite.findAll({where:{userId:user.id},include:[{model:Event,as:'event',where:{isPublished:true},attributes:['id','title','startAt']}],order:[['createdAt','DESC']],limit:50}):[];
 res.json({success:true,data:{...summary(user),interests:visible?user.interests:[],favorites:favorites.map(f=>f.event),bio:visible?user.bio:'',followers,following,isFollowing:!!isFollowing,canSeePosts:visible,isMine:req.user?.id===user.id}});
}));
router.get('/social/feed',optionalAuth,asyncHandler(async(req,res)=>{
 const page=Math.max(1,Math.min(50,parseInt(req.query.page,10)||1));
 const blockedRows=req.user?await UserBlock.findAll({where:{[Op.or]:[{blockerId:req.user.id},{blockedId:req.user.id}]}}):[];
 const excluded=new Set(blockedRows.map(x=>x.blockerId===req.user?.id?x.blockedId:x.blockerId));
 const follows=req.user?await UserFollow.findAll({where:{followerId:req.user.id}}):[];
 const allowedPrivate=[req.user?.id,...follows.map(f=>f.followingId)].filter(Boolean);
 const where={};if(excluded.size)where.authorId={[Op.notIn]:[...excluded]};
 const authors=await User.findAll({attributes:['id','isPrivate']});
 const visibleIds=authors.filter(u=>!excluded.has(u.id)&&(!u.isPrivate||allowedPrivate.includes(u.id))).map(u=>u.id);
 if(!visibleIds.length)return res.json({success:true,data:[]});
 where.authorId={[Op.in]:visibleIds};
 const posts=await Post.findAll({where,include:[{model:User,as:'author'},{model:Event,as:'event',attributes:['id','title']}],order:[['createdAt','DESC']],limit:20,offset:(page-1)*20});
 res.json({success:true,data:await Promise.all(posts.map(p=>serializePost(p,req.user?.id)))});
}));
router.get('/users/:username/posts',optionalAuth,asyncHandler(async(req,res)=>{
 const user=await User.findOne({where:{username:req.params.username}});
 if(!user||!await canSee(user,req.user?.id))throw new AppError('Publicações privadas ou perfil não encontrado.',404);
 const posts=await Post.findAll({where:{authorId:user.id},include:[{model:User,as:'author'},{model:Event,as:'event',attributes:['id','title']}],order:[['createdAt','DESC']],limit:40});
 res.json({success:true,data:await Promise.all(posts.map(p=>serializePost(p,req.user?.id)))});
}));
router.post('/social/posts',auth,[body('caption').isString().trim().isLength({min:1,max:2000}),body('imageUrl').optional({nullable:true}).custom(v=>!v||isSafeImageUrl(v)),body('eventId').optional({nullable:true}).isInt({min:1})],requireValid,asyncHandler(async(req,res)=>{
 if(req.body.eventId&&!await Event.findByPk(req.body.eventId))throw new AppError('Evento não encontrado.',404);
 const photo=await require('../services/photo').preparePhoto(req.body.photo);
 const post=await Post.create({authorId:req.user.id,caption:req.body.caption,imageUrl:photo||req.body.imageUrl||null,eventId:req.body.eventId||null});
 res.status(201).json({success:true,data:{id:post.id},message:'Momento publicado.'});
}));
router.delete('/social/posts/:id',auth,asyncHandler(async(req,res)=>{
 const post=await Post.findByPk(integer(req.params.id));
 if(!post)throw new AppError('Publicação não encontrada.',404);
 if(post.authorId!==req.user.id){const viewer=await User.findByPk(req.user.id);if(!viewer?.isAdmin)throw new AppError('Acesso negado.',403)}
 await sequelize.transaction(async t=>{
  await PostReport.destroy({where:{postId:post.id},transaction:t});await PostLike.destroy({where:{postId:post.id},transaction:t});await PostComment.destroy({where:{postId:post.id},transaction:t});await post.destroy({transaction:t});
 });
 res.json({success:true,message:'Publicação removida.'});
}));
router.post('/social/posts/:id/like',auth,asyncHandler(async(req,res)=>{
 const post=await requireVisiblePost(integer(req.params.id),req.user.id);
 await PostLike.findOrCreate({where:{postId:post.id,userId:req.user.id}});
 res.json({success:true,message:'Curtida adicionada.'});
}));
router.delete('/social/posts/:id/like',auth,asyncHandler(async(req,res)=>{
 await PostLike.destroy({where:{postId:integer(req.params.id),userId:req.user.id}});
 res.json({success:true});
}));
router.post('/social/posts/:id/comments',auth,body('content').isString().trim().isLength({min:1,max:600}),requireValid,asyncHandler(async(req,res)=>{
 const post=await requireVisiblePost(integer(req.params.id),req.user.id);
 const comment=await PostComment.create({postId:post.id,authorId:req.user.id,content:req.body.content});
 res.status(201).json({success:true,data:{id:comment.id}});
}));
router.delete('/social/comments/:id',auth,asyncHandler(async(req,res)=>{
 const comment=await PostComment.findByPk(integer(req.params.id),{include:[{model:Post,as:'post'}]});
 if(!comment)throw new AppError('Comentário não encontrado.',404);
 if(comment.authorId!==req.user.id && comment.post.authorId!==req.user.id)throw new AppError('Acesso negado.',403);
 await comment.destroy();res.json({success:true});
}));
router.post('/users/:username/follow',auth,asyncHandler(async(req,res)=>{
 const target=await User.findOne({where:{username:req.params.username}});
 if(!target)throw new AppError('Usuário não encontrado.',404);
 if(target.id===req.user.id)throw new AppError('Não é possível seguir seu próprio perfil.',400);
 if(await blocked(req.user.id,target.id))throw new AppError('Perfil indisponível.',403);
 // Perfis privados não aceitam seguidores sem aprovação: a funcionalidade de solicitação é futura.
 if(target.isPrivate)throw new AppError('Este perfil é privado e não recebe novos seguidores nesta versão.',403);
 await UserFollow.findOrCreate({where:{followerId:req.user.id,followingId:target.id}});
 res.json({success:true});
}));
router.delete('/users/:username/follow',auth,asyncHandler(async(req,res)=>{
 const target=await User.findOne({where:{username:req.params.username}});
 if(!target)throw new AppError('Usuário não encontrado.',404);
 await UserFollow.destroy({where:{followerId:req.user.id,followingId:target.id}});res.json({success:true});
}));
router.post('/users/:username/block',auth,asyncHandler(async(req,res)=>{
 const target=await User.findOne({where:{username:req.params.username}});
 if(!target||target.id===req.user.id)throw new AppError('Usuário inválido.',400);
 await sequelize.transaction(async t=>{
  await UserBlock.findOrCreate({where:{blockerId:req.user.id,blockedId:target.id},transaction:t});
  await UserFollow.destroy({where:{[Op.or]:[{followerId:req.user.id,followingId:target.id},{followerId:target.id,followingId:req.user.id}]},transaction:t});
 });res.json({success:true});
}));
router.get('/social/blocked',auth,asyncHandler(async(req,res)=>{
 const rows=await UserBlock.findAll({where:{blockerId:req.user.id},include:[{model:User,as:'blocked',attributes:['username','fullName']}]});
 res.json({success:true,data:rows.map(row=>row.blocked)});
}));
router.delete('/users/:username/block',auth,asyncHandler(async(req,res)=>{
 const target=await User.findOne({where:{username:req.params.username}});if(!target)throw new AppError('Usuário não encontrado.',404);
 await UserBlock.destroy({where:{blockerId:req.user.id,blockedId:target.id}});res.json({success:true});
}));
router.post('/social/posts/:id/report',auth,body('reason').isString().trim().isLength({min:5,max:300}),requireValid,asyncHandler(async(req,res)=>{
 const post=await requireVisiblePost(integer(req.params.id),req.user.id);
 if(post.authorId===req.user.id)throw new AppError('Não é possível denunciar a própria publicação.',400);
 await PostReport.findOrCreate({where:{postId:post.id,reporterId:req.user.id},defaults:{reason:req.body.reason}});
 res.status(201).json({success:true,message:'Denúncia recebida para moderação.'});
}));
module.exports=router;
