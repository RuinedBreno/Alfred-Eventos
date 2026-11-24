const {verifyToken}=require('../config/jwt');
module.exports=(req,res,next)=>{
 const [scheme,token]=(req.headers.authorization||'').split(' ');
 if(scheme==='Bearer'&&token){try{req.user=verifyToken(token)}catch{return res.status(401).json({success:false,message:'Sessão inválida ou expirada.'})}}
 next();
};
