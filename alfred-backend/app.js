require('dotenv').config();
const express=require('express');
const cors=require('cors');
const morgan=require('morgan');
const {sequelize}=require('./models');
const authRoutes=require('./routes/auth');
const eventRoutes=require('./routes/events');
const orderRoutes=require('./routes/orders');
const recommendationRoutes=require('./routes/recommendations');
const profileRoutes=require('./routes/profile');
const adminRoutes=require('./routes/admin');
const socialRoutes=require('./routes/social');
const citiesRoutes=require('./routes/cities');
const app=express();
app.disable('x-powered-by');
morgan.token('path',req=>req.originalUrl.split('?')[0].replace(/(\/tickets\/)[0-9a-f-]+(\/qr)/i,'$1…$2'));
app.use(morgan(':method :path :status :response-time ms'));
const allowedOrigins=(process.env.CORS_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173').split(',').map(x=>x.trim());
app.use(cors({origin:(origin,callback)=>callback(null,!origin || allowedOrigins.includes(origin))}));
app.post('/api/payments/webhook',express.raw({type:'application/json'}),require('./services/checkout').webhook);
app.use(['/api/profile','/api/social/posts'],express.json({limit:'760kb'}));
app.use(express.json({limit:'64kb'}));
app.get('/api',(req,res)=>res.json({success:true,data:{name:'Alfred API',version:require('./package.json').version,status:'online'}}));
app.use('/api',authRoutes);
app.use('/api',eventRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/tickets',require('./routes/tickets'));
app.use('/api',recommendationRoutes);
app.use('/api',profileRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api',socialRoutes);
app.use('/api',citiesRoutes);
app.use((req,res)=>res.status(404).json({success:false,message:'Rota não encontrada.'}));
app.use((err,req,res,next)=>{
  if(!err.status || err.status>=500) console.error('[Alfred]',err.name,err.message);
  res.status(err.status || 500).json({success:false,message:err.status ? err.message : 'Erro interno do servidor.'});
});
if (require.main===module) {
  sequelize.authenticate().then(()=>{
    console.log('[Alfred] Banco conectado. Rode npm run seed para criar as tabelas e dados demonstrativos.');
    app.listen(Number(process.env.PORT || 3000),()=>console.log(`Alfred API em http://localhost:${process.env.PORT || 3000}`));
  }).catch(err=>{console.error('[Alfred] Não foi possível conectar ao banco:',err.message);process.exitCode=1;});
}
module.exports=app;
