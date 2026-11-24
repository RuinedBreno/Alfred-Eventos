const router = require('express').Router();
const {normalizeCnpj} = require('../services/cnpj');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateToken } = require('../config/jwt');
const {INTERESTS,GENRES}=require('../services/interests');
const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../middlewares/auth');
function validate(req, res, next) {
  const errors = validationResult(req);
  return errors.isEmpty() ? next() : res.status(400).json({success:false,message:'Verifique os campos do formulário.',errors:errors.array().map(({path,msg})=>({path,msg}))});
}
const {publicUser}=require('../services/userPublic');
router.post('/register', [
  body('accountType').optional().isIn(['personal','company']),
  body('fullName').trim().isLength({min:2,max:120}),
  body('username').trim().matches(/^[a-zA-Z0-9_]{3,40}$/),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({min:8,max:128}),
  body('preferredCity').optional().isString().trim().isLength({max:90}),
  body('interests').optional().isArray({max:20}),
  body('interests.*').optional().isIn(INTERESTS)
], validate, asyncHandler(async (req,res) => {
  const {fullName,username,email,password,interests=[],preferredCity=null} = req.body;
  const company = req.body.accountType === 'company';
  const cnpj = company ? normalizeCnpj(req.body.cnpj) : null;
  if (company && !cnpj) return res.status(400).json({message:'Informe um CNPJ válido.'});
  if (!company && req.body.cnpj != null) return res.status(400).json({message:'Use o cadastro de empresa para informar CNPJ.'});
  const exists = await User.findOne({where:{email}}) || await User.findOne({where:{username}});
  if (exists) return res.status(409).json({success:false,message:'E-mail ou usuário já cadastrado.'});
  const user = await User.create({isOrganizer:company,cnpj,fullName,username,email,password:await bcrypt.hash(password,10),preferredCity,interests,musicGenres:interests.filter(x=>GENRES.includes(x))});
  return res.status(201).json({success:true,data:publicUser(user),message:'Cadastro realizado. Faça seu login.'});
}));
router.put('/company/cnpj',auth,asyncHandler(async(req,res)=>{
  const user = await User.findByPk(req.user.id);
  if (!user?.isOrganizer) return res.status(403).json({message:'Acesso exclusivo de empresas.'});
  const cnpj = normalizeCnpj(req.body.cnpj);
  if (!cnpj) return res.status(400).json({message:'Informe um CNPJ válido.'});
  const [updated] = await User.update({cnpj},{where:{id:user.id,cnpj:null}});
  if (!updated) return res.status(409).json({message:'A conta já possui CNPJ.'});
  await user.reload();
  res.json({data:publicUser(user)});
}));
router.use((error,req,res,next)=>{
  if(error.name==='SequelizeUniqueConstraintError') return res.status(409).json({message:'E-mail, usuário ou CNPJ já cadastrado.'});
  next(error);
});
router.post('/login', [body('email').trim().isEmail().normalizeEmail(),body('password').notEmpty()], validate, asyncHandler(async (req,res) => {
  const user = await User.findOne({where:{email:req.body.email}});
  if (!user || !(await bcrypt.compare(req.body.password,user.password))) return res.status(401).json({success:false,message:'E-mail ou senha incorretos.'});
  res.json({ token:generateToken({id:user.id,isAdmin:user.isAdmin}), user:publicUser(user) });
}));
router.get('/me',auth,asyncHandler(async (req,res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({success:false,message:'Usuário não encontrado.'});
  return res.json({success:true,data:publicUser(user)});
}));
module.exports = router;
