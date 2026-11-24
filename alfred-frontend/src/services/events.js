import api from './api'
import demo from '../data/demo.json'
export async function listEvents(params={}) {
  try {
    const response=await api.get('/events',{params})
    return {data:response.data,demo:false}
  } catch (error) {
    if (error.status) throw error
    const city=String(params.city||'').toLowerCase()
    const search=String(params.q||'').toLowerCase()
    return {demo:true,data:demo.events.filter(e=>(!city || e.venue.city.toLowerCase()===city) && (!params.category || e.category===params.category) && (!search || e.title.toLowerCase().includes(search)) && (!params.from||e.startAt.slice(0,10)>=params.from) && (!params.to||e.startAt.slice(0,10)<=params.to) && new Date(e.startAt)>new Date()).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt))}
  }
}
export async function getEvent(id) {
  try {const response=await api.get(`/events/${id}`); return {data:response.data,demo:false}}
  catch(error) {
    if(error.status) throw error
    return {data:demo.events.find(e=>e.id===Number(id) && new Date(e.startAt)>new Date())||null,demo:true}
  }
}
export async function listVenues(city='') {
  try {const response=await api.get('/venues',{params:city?{city}:{}});return {data:response.data,demo:false}}
  catch(error) {if(error.status) throw error;return {data:demo.venues.filter(v=>!city || v.city===city),demo:true}}
}
export async function createDemoOrder(ticketLotId,quantity){return api.post('/orders/demo',{ticketLotId,quantity})}
export async function listOrders(){return api.get('/orders')}
export {demo}

export async function listRecommendations(params={}){const response=await api.get('/recommendations',{params});return response.data}
export async function cancelOrder(id){return api.patch(`/orders/${id}/cancel`)}
