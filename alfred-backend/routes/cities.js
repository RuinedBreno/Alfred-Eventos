const router=require('express').Router();
const {Op}=require('sequelize');
const {State,City}=require('../models');
const asyncHandler=require('../middlewares/asyncHandler');
router.get('/states',asyncHandler(async(req,res)=>res.json({success:true,data:await State.findAll({attributes:['ibgeId','uf','name'],order:[['name','ASC']]})})));
router.get('/cities',asyncHandler(async(req,res)=>{
 const q=String(req.query.q||'').trim().slice(0,100);
 const uf=String(req.query.uf||'').trim().toUpperCase();
 if(q.length<2 && !uf)return res.status(400).json({success:false,message:'Informe pelo menos duas letras ou uma UF.'});
 if(uf && !/^[A-Z]{2}$/.test(uf))return res.status(400).json({success:false,message:'UF inválida.'});
 const states=uf?await State.findAll({where:{uf}}):[];
 const where={};if(uf)where.stateId={[Op.in]:states.map(s=>s.id)};
 if(q)where.name={[Op.like]:`%${q.replace(/[\%_]/g,'\$&')}%`};
 const rows=await City.findAll({where,include:[{model:State,as:'state',attributes:['uf']}],order:[['name','ASC']],limit:100});
 res.json({success:true,data:rows.map(row=>({ibgeId:row.ibgeId,name:row.name,uf:row.state?.uf||''}))});
}));
module.exports=router;
