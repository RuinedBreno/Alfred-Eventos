<script setup>
import {ref,onMounted,computed} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import {getEvent,createDemoOrder} from '../services/events'
import api from '../services/api'
import {useAuthStore} from '../stores/auth'
import {usePreferences} from '../stores/preferences'
import {brl,dateParts,categoryLabel} from '../utils'
const route=useRoute(),router=useRouter(),auth=useAuthStore(),pref=usePreferences()
const event=ref(null),isDemo=ref(false),busy=ref(false),error=ref(''),success=ref(''),selectedLot=ref(''),quantity=ref(1)
onMounted(async()=>{try{const r=await getEvent(route.params.id);event.value=r.data;isDemo.value=r.demo;selectedLot.value=event.value?.lots?.find(l=>l.available>0)?.id||'';if(!event.value)error.value='Evento indisponível.'}catch(e){error.value=e.message}})
const favorite=ref(false),favBusy=ref(false)
async function toggleFavorite(){if(!auth.token){router.push({name:'login',query:{redirect:route.fullPath}});return}favBusy.value=true;error.value='';try{if(favorite.value)await api.delete(`/favorites/${route.params.id}`);else await api.post(`/favorites/${route.params.id}`);favorite.value=!favorite.value}catch(e){error.value=e.message}finally{favBusy.value=false}}
onMounted(async()=>{if(!auth.token)return;try{const list=(await api.get('/favorites')).data;favorite.value=list.some(x=>x.eventId===Number(route.params.id))}catch{/* sem favoritos se API indisponível */}})
const currentLot=computed(()=>event.value?.lots?.find(l=>String(l.id)===String(selectedLot.value)))
const total=computed(()=>Number(currentLot.value?.price||0)*quantity.value)
let lastRequest
async function checkout(){
 if(!auth.token){await router.push({name:'login',query:{redirect:route.fullPath}});return}
 busy.value=true;error.value=''
 const selection=selectedLot.value+'-'+quantity.value
 if(lastRequest?.selection!==selection)lastRequest={selection,key:crypto.randomUUID()}
 try{
  const {data}=await api.post('/tickets/checkout',{ticketLotId:Number(selectedLot.value),quantity:quantity.value,requestKey:lastRequest.key})
  if(data.url)window.location.assign(data.url)
  else await router.push('/meus-ingressos')
 }catch(e){error.value=e.message}finally{busy.value=false}
}
async function reserve(){error.value='';success.value='';if(!event.value || !currentLot.value)return
 if(!auth.token && !isDemo.value){router.push({name:'login',query:{redirect:route.fullPath}});return}
 busy.value=true
 try{
  if(isDemo.value){
   if(quantity.value>currentLot.value.available)throw new Error('Quantidade indisponível neste lote.')
   pref.addDemoOrder({id:`LOCAL-${Date.now()}`,eventId:event.value.id,quantity:quantity.value,total:total.value,createdAt:new Date().toISOString(),status:'DEMO',event:event.value,lot:currentLot.value})
  }else{
   await createDemoOrder(Number(selectedLot.value),quantity.value)
   currentLot.value.available-=quantity.value
   quantity.value=1
  }
  success.value='Reserva de demonstração registrada. Não houve cobrança e ela não funciona como ingresso válido.'
 }catch(e){error.value=e.message||'Não foi possível reservar.'}finally{busy.value=false}
}
</script>
<template>
 <div v-if="!event" class="container detail-loading"><h2>{{error||'Carregando evento...'}}</h2><router-link to="/">← Voltar</router-link></div>
 <template v-else><div class="detail-hero" :class="`art-${event.accent||'violet'}`"><div class="container detail-hero-content"><router-link to="/" class="light-back">← Voltar à programação</router-link><div class="detail-hero-title"><span class="event-pill detail-pill">{{categoryLabel(event.category)}}</span><h1>{{event.title}}</h1><p>⌖ {{event.venue?.name}} · {{event.venue?.city}}/{{event.venue?.state}}</p></div><div class="detail-decor" aria-hidden="true">✳</div></div></div>
 <div class="container detail-layout"><div class="detail-main"><span class="kicker">SOBRE A EXPERIÊNCIA</span><h2>Para viver e lembrar.</h2><p class="detail-description">{{event.description}}</p><button class="button button-outline" :disabled="favBusy||isDemo" @click="toggleFavorite">{{favorite?'♥ Remover dos salvos':'♡ Salvar evento'}}</button><small v-if="isDemo" class="help-text">Favoritos exigem um evento cadastrado na API.</small><div class="detail-facts"><div><span>◷</span><strong>Quando</strong><p>{{dateParts(event.startAt).full}}, {{dateParts(event.startAt).time}}</p></div><div><span>⌖</span><strong>Onde</strong><p>{{event.venue?.name}}<br/>{{event.venue?.address}}, {{event.venue?.city}}/{{event.venue?.state}}</p></div><div><span>♫</span><strong>Estilo</strong><p>{{event.genres?.length ? event.genres.join(' · ') : categoryLabel(event.category)}}</p></div></div><div class="disclaimer">Os eventos da carga inicial são fictícios. Consulte os detalhes do organizador antes de confirmar.</div></div>
 <aside class="checkout-card"><div class="checkout-top"><span>SEU LUGAR NA EXPERIÊNCIA</span><h3>Selecionar ingressos</h3></div><form @submit.prevent="reserve"><label class="field-label" for="lot">Tipo de ingresso</label><select class="form-control" id="lot" v-model="selectedLot"><option v-for="lot in event.lots" :key="lot.id" :value="lot.id" :disabled="lot.available<1">{{lot.name}} · {{brl(lot.price)}} ({{lot.available}} disponíveis)</option></select><label class="field-label" for="qty">Quantidade</label><select class="form-control" id="qty" v-model.number="quantity"><option v-for="n in Math.min(6,Number(currentLot?.available||0))" :key="n" :value="n">{{n}} ingresso{{n>1?'s':''}}</option></select><div class="checkout-total"><span>Total do lote</span><strong>{{brl(total)}}</strong></div><button type="submit" class="button button-primary button-full" :disabled="busy||!currentLot||!Number(currentLot.available)">{{busy?'Registrando...':'Simular reserva'}} ↗</button><button v-if="!isDemo" type="button" class="button button-dark button-full" :disabled="busy||!currentLot||quantity>currentLot.available" @click="checkout">{{total===0?'Emitir ingresso gratuito':'Ir para pagamento'}}</button><small class="help-text">A simulação fica no histórico. A emissão gera um QR por ingresso após a confirmação.</small><p v-if="error" class="notice-error" role="alert">{{error}}</p><p v-if="success" class="notice-success" role="status">{{success}} <router-link to="/meus-ingressos">Ver em Meus ingressos</router-link></p></form></aside>
 </div></template>
</template>
