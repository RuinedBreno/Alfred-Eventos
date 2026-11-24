const { Order, Ticket, Event, Venue, TicketLot } = require('../models');
module.exports={
  create: (payload,transaction) => Order.create(payload,{transaction}),
  findForUser: (id,userId,transaction) => Order.findOne({where:{id,userId},transaction}),
  async setCancelled(id,userId,transaction) {
    const [count]=await Order.update({status:'CANCELLED'},{where:{id,userId,status:'DEMO'},transaction});
    return count===1;
  },
  listForUser: userId => Order.findAll({where:{userId},include:[{model:Ticket,as:'tickets',attributes:['code','checkedAt']},{model:Event,as:'event',include:[{model:Venue,as:'venue'}]},{model:TicketLot,as:'lot'}],order:[['createdAt','DESC']]})
};
