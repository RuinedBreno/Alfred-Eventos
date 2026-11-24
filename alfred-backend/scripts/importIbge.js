require('dotenv').config();
const {sequelize,State,City}=require('../models');
async function importCities(){
 let rows;
 if(process.argv.includes('--offline')) rows=require('../seed/municipios.json');
 else {
  const response=await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios',{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('IBGE HTTP '+response.status);
  rows=(await response.json()).map(city=>{
   const state=city['regiao-imediata']?.['regiao-intermediaria']?.UF || city.microrregiao?.mesorregiao?.UF;
   return [city.id,city.nome,state.id,state.sigla,state.nome];
  });
 }
 const states=new Map(rows.map(([, ,ibgeId,uf,name])=>[ibgeId,{ibgeId,uf,name}]));
 if(states.size!==27||rows.length<5000)throw Error('Lista do IBGE incompleta.');
 await sequelize.transaction(async transaction=>{
  await State.bulkCreate([...states.values()],{transaction,updateOnDuplicate:['name','uf']});
  const lookup=new Map((await State.findAll({transaction})).map(state=>[state.ibgeId,state.id]));
  for(let offset=0;offset<rows.length;offset+=500){
   const cities=rows.slice(offset,offset+500).map(([ibgeId,name,state])=>({ibgeId,name,stateId:lookup.get(state)}));
   await City.bulkCreate(cities,{transaction,updateOnDuplicate:['name','state_id']});
  }
 });
 console.log('IBGE: '+states.size+' UFs e '+rows.length+' municípios.');
}
importCities().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>sequelize.close());
