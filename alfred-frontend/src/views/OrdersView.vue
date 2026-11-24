<script setup>
import {ref,onMounted,computed} from 'vue'
import {usePreferences} from '../stores/preferences'
import {listOrders,cancelOrder} from '../services/events'
import {useAuthStore} from '../stores/auth'
import api from '../services/api'
import {brl,dateParts} from '../utils'
const auth=useAuthStore(),pref=usePreferences(),remote=ref([]),error=ref(''),busy=ref(true)
onMounted(async()=>{if(!auth.token){busy.value=false;return}try{const r=await listOrders();remote.value=r.data}catch(e){error.value='A API está indisponível. Exibindo apenas reservas simuladas salvas neste navegador.'}finally{busy.value=false}})
async function resume(id){
 try{
  const {data}=await api.post('/tickets/orders/'+id+'/resume')
  if(data.url)location.assign(data.url)
  else remote.value=(await listOrders()).data
 }catch(e){error.value=e.message}
}
const qr=ref({}), opened=ref(null), loadingQR=ref({})
async function openOrder(order){
 opened.value=opened.value===order.id?null:order.id
 if(opened.value===null || order.status!=='CONFIRMED')return
 const first=order.tickets?.find(t=>!t.checkedAt)
 if(first)await showTicket(first.code)
}
async function showTicket(code){
 if(qr.value[code] || loadingQR.value[code])return
 loadingQR.value[code]=true;error.value=''
 try{qr.value[code]=(await api.get('/tickets/'+code+'/qr')).data}
 catch(e){error.value=e.message}finally{loadingQR.value[code]=false}
}
const labels={DEMO:'Simulação',CONFIRMED:'Confirmado',CANCELLED:'Cancelado',PENDING:'Aguardando pagamento'}
const cancelBusy=ref(null)
async function cancel(order){if(!confirm('Cancelar esta reserva fictícia?'))return;cancelBusy.value=order.id;error.value='';try{if(String(order.id).startsWith('LOCAL-'))pref.removeDemoOrder(order.id);else {await cancelOrder(order.id);const found=remote.value.find(x=>x.id===order.id);if(found)found.status='CANCELLED'}}catch(e){error.value=e.message}finally{cancelBusy.value=null}}
const orders=computed(()=>[...pref.demoOrders,...remote.value])
</script>
<template><div class="page-top tickets-top"><div class="container"><span class="kicker light">✦ SUA AGENDA</span><h1>Alfred <em>Wallet.</em></h1><p>Consulte seus pedidos e apresente o QR individual na entrada.</p></div></div><div class="container orders-content"><div class="notice-inline">Pedidos pagos aparecem após a confirmação do provedor. Atualize a página para consultar o status.</div><p v-if="error" class="help-text">{{error}}</p><div v-if="busy">Carregando reservas...</div><div v-else-if="orders.length" class="orders-list"><article v-for="order in orders" :key="order.id" class="order-row"><button type="button" class="order-summary" :aria-expanded="opened===order.id" @click="openOrder(order)"><span class="order-symbol">✳</span><span><span class="kicker">PEDIDO #{{order.id}}</span><strong class="ticket-title">{{order.event?.title || "Detalhes do pedido"}}</strong><span>{{order.event?.venue?.city}} · {{order.event?.startAt?dateParts(order.event.startAt).full:''}}</span><span>{{order.quantity}}x {{order.lot?.name}} · {{brl(order.total)}}</span></span><span><span class="order-demo-label">{{labels[order.status]||order.status}}</span><small>{{opened===order.id?'Fechar detalhes':'Abrir detalhes'}}</small></span></button>
 <div v-if="opened===order.id" class="ticket-details">
 <p v-if="order.status==='DEMO'">Simulação registrada. Para receber um QR, emita um ingresso gratuito ou conclua o pagamento do lote.</p>
 <p v-else-if="order.status==='CANCELLED'">Pedido cancelado.</p>
 <p v-else-if="order.status==='CONFIRMED' && !order.tickets?.length" role="alert">A API confirmou o pedido mas não retornou seus ingressos.</p><button v-if="order.status==='PENDING'" class="subtle-button" @click="resume(order.id)">Consultar pagamento</button><div v-for="(ticket,index) in order.tickets" :key="ticket.code"><span v-if="ticket.checkedAt">Utilizado</span><template v-else><button class="subtle-button" @click="showTicket(ticket.code)" :disabled="loadingQR[ticket.code]">{{loadingQR[ticket.code]?'Carregando QR…':'Exibir ingresso '+(index+1)}}</button><div v-if="qr[ticket.code]"><img :src="qr[ticket.code]" alt="QR individual de entrada"/><small>{{ticket.code}}</small></div></template></div><button v-if="order.status==='DEMO'" class="subtle-button" style="display:block;margin-top:12px" :disabled="cancelBusy===order.id" @click="cancel(order)">Cancelar reserva</button></div></article></div><div v-else class="empty-state"><h2>Ainda sem reservas.</h2><p>Escolha um evento e teste o fluxo de reserva.</p><router-link class="button button-dark" to="/">Explorar eventos ↗</router-link></div></div></template>
<style scoped>
.orders-list .order-row { display:block; }
.order-summary { display:flex; align-items:center; gap:1rem; padding:.5rem; width:100%; background:transparent; border:0; color:inherit; text-align:left; font:inherit; cursor:pointer; }
.order-summary > span:nth-child(2) { flex:1; min-width:0; }
.order-summary > span:nth-child(2) > *, .order-summary small { display:block; }
.ticket-title { font-size:1.15rem; }
.order-summary small { margin-top:.35rem; text-decoration:underline; }
.ticket-details { margin:1rem .5rem; overflow-wrap:anywhere; }
.ticket-details img { display:block; width:13rem; max-width:100%; height:auto; }
@media(max-width:520px){ .order-summary { flex-wrap:wrap; } .order-summary .order-symbol { display:none; } }
</style>

