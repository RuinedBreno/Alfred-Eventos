require('dotenv').config();
const {sequelize,Venue,Event,TicketLot,Order}=require('../models');
const data=require('./demo-data.json');
(async()=>{
  await sequelize.authenticate();
  await sequelize.sync(); // Em banco de dev novo. Para esquema existente, use migrações ou recrie o banco.
  for (const venue of data.venues) {
    const {id,...fields}=venue;
    const [row]=await Venue.findOrCreate({where:{id},defaults:{id,...fields}});
    if(row.name!==fields.name) console.warn('Local ID já utilizado:',id);
  }
  const lastDate=Math.max(...data.events.map(e=>Date.parse(e.startAt)));
  const shift=lastDate<Date.now()?Math.ceil((Date.now()-Math.min(...data.events.map(e=>Date.parse(e.startAt))))/86400000+1)*86400000:0;
  for (const event of data.events) {
    const {venue,lots,...fields}=event;
    if(shift){fields.startAt=new Date(Date.parse(fields.startAt)+shift);if(fields.endAt)fields.endAt=new Date(Date.parse(fields.endAt)+shift)}
    const [record,created]=await Event.findOrCreate({where:{id:event.id},defaults:fields});
    if(!created && record.title===fields.title && (await Order.count({where:{eventId:event.id}}))===0 && new Date(record.startAt)<new Date() && new Date(fields.startAt)>new Date()){
      await record.update({startAt:fields.startAt,endAt:fields.endAt||null});
    }
    for(const lot of lots) await TicketLot.findOrCreate({where:{id:lot.id},defaults:{...lot,eventId:event.id}});
  }
  console.log(`Dados de DEMONSTRAÇÃO: ${data.venues.length} locais e ${data.events.length} eventos fictícios.`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>sequelize.close());
