const {AppError}=require('./errors');
// DIP: depende de contratos pequenos (métodos do repositório), não de models Sequelize.
// Injeção de dependências permite teste sem banco de dados.
function createOrderService({ ticketRepository, orderRepository, transactionManager, clock=()=>new Date() }) {
  return {
    async reserve({userId,ticketLotId,quantity}) {
      if(!Number.isSafeInteger(ticketLotId) || ticketLotId<1 || !Number.isInteger(quantity) || quantity<1 || quantity>6)
        throw new AppError('Selecione um lote e de 1 a 6 ingressos.',400);
      return transactionManager.run(async(transaction)=>{
        const lot=await ticketRepository.findLot(ticketLotId,transaction);
        if(!lot || !lot.event || !lot.event.isPublished || new Date(lot.event.startAt)<=clock())
          throw new AppError('Evento ou lote indisponível.',404);
        const stockReduced=await ticketRepository.reduceStock(ticketLotId,quantity,transaction);
        if(!stockReduced) throw new AppError('Estoque insuficiente.',409);
        // centavos evitam erros acumulados de ponto flutuante
        const cents=Math.round(Number(lot.price)*100)*quantity;
        return orderRepository.create({userId,eventId:lot.eventId,ticketLotId,quantity,total:(cents/100).toFixed(2),status:'DEMO'},transaction);
      });
    },
    async cancel({userId,orderId}) {
      if(!Number.isSafeInteger(orderId) || orderId<1) throw new AppError('Reserva inválida.',400);
      return transactionManager.run(async(transaction)=>{
        const order=await orderRepository.findForUser(orderId,userId,transaction);
        if(!order) throw new AppError('Reserva não encontrada.',404);
        if(order.status!=='DEMO') throw new AppError('Reserva já cancelada.',409);
        if(!await orderRepository.setCancelled(orderId,userId,transaction))
          throw new AppError('Reserva já cancelada.',409);
        await ticketRepository.restoreStock(order.ticketLotId,order.quantity,transaction);
        return {id:orderId,status:'CANCELLED'};
      });
    },
    list: userId => orderRepository.listForUser(userId)
  };
}
module.exports={createOrderService};
