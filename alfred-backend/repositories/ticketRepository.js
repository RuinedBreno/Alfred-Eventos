const { Op } = require('sequelize');
const { TicketLot, Event, sequelize } = require('../models');
module.exports = {
  findLot: (id, transaction) => TicketLot.findByPk(id, { include:[{model:Event,as:'event'}],transaction }),
  async reduceStock(id,quantity,transaction){
    const [count]=await TicketLot.update({available:sequelize.literal(`available - ${Number(quantity)}`)},
      {where:{id,available:{[Op.gte]:quantity}},transaction});
    return count===1;
  },
  restoreStock: (id,quantity,transaction) => TicketLot.increment('available',{by:quantity,where:{id},transaction})
};
