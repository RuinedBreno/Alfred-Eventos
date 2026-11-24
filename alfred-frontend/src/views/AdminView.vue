<script setup>
import {ref,onMounted,computed} from 'vue'
import {useAuthStore} from '../stores/auth'
const auth=useAuthStore()
const isAdmin=computed(()=>!!auth.user?.isAdmin)
import api from '../services/api'
import {CATEGORIES,brl,dateParts} from '../utils'
const stats=ref({}),events=ref([]),venues=ref([]),loading=ref(true),error=ref(''),notice=ref(''),busy=ref(false)
const blankEvent=()=>({title:'',description:'',category:'shows',startAt:'',venueId:'',genres:'',performers:'',accent:'violet',isPublished:true})
const form=ref(blankEvent()),editing=ref(null),lotForm=ref({name:'Inteira',price:50,available:30}),venueForm=ref({name:'',city:'',state:'SC',address:'',latitude:'',longitude:''}),reports=ref([])
const checkEvent=ref(''),checkCode=ref('')
async function checkIn(){
 busy.value=true;error.value='';notice.value=''
 try{const {data}=await api.post('/tickets/check-in',{code:checkCode.value.trim(),eventId:checkEvent.value});notice.value='Entrada confirmada para '+data.event;checkCode.value=''}catch(e){error.value=e.message}finally{busy.value=false}
}
const edited=computed(()=>events.value.find(x=>x.id===editing.value))
function asLocal(iso){const d=new Date(iso);const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)}
async function load(){loading.value=true;try{
 const [s,e,v]=await Promise.all([isAdmin.value?api.get('/admin/stats'):Promise.resolve({data:{}}),api.get('/admin/events'),api.get('/venues')]);stats.value=s.data;events.value=e.data;venues.value=v.data;if(isAdmin.value) reports.value=(await api.get('/admin/reports')).data
}catch(err){error.value=err.message}finally{loading.value=false}}
const needsCnpj=computed(()=>auth.user?.isOrganizer && !isAdmin.value && !auth.user.hasCnpj)
const cnpj=ref('')
async function completeCompany(){
 busy.value=true;error.value=''
 try{
  const result=await api.put('/company/cnpj',{cnpj:cnpj.value})
  auth.setAuth(auth.token,result.data)
  await load()
 }catch(err){error.value=err.message}finally{busy.value=false}
}
onMounted(()=>{if(!needsCnpj.value)load()})
function edit(event){editing.value=event.id;form.value={title:event.title,description:event.description,category:event.category,startAt:asLocal(event.startAt),venueId:event.venueId,genres:(event.genres||[]).join(', '),performers:(event.performers||[]).join(', '),accent:event.accent||'violet',isPublished:event.isPublished};window.scrollTo({top:0,behavior:'smooth'})}
function reset(){editing.value=null;form.value=blankEvent()}
const split=x=>x.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
async function saveEvent(){busy.value=true;error.value='';notice.value='';try{
 const payload={...form.value,venueId:Number(form.value.venueId),startAt:new Date(form.value.startAt).toISOString(),genres:split(form.value.genres),performers:form.value.performers.split(',').map(s=>s.trim()).filter(Boolean)}
 if(editing.value)await api.patch(`/admin/events/${editing.value}`,payload);else await api.post('/admin/events',payload)
 notice.value='Evento salvo.';reset();await load()
}catch(err){error.value=err.message}finally{busy.value=false}}
async function toggle(event){error.value='';try{await api.patch(`/admin/events/${event.id}/publication`,{isPublished:!event.isPublished});await load()}catch(err){error.value=err.message}}
async function addLot(){if(!editing.value)return;busy.value=true;error.value='';try{await api.post(`/admin/events/${editing.value}/lots`,{...lotForm.value,available:Number(lotForm.value.available),price:Number(lotForm.value.price)});notice.value='Lote adicionado ao evento.';await load()}catch(err){error.value=err.message}finally{busy.value=false}}
async function moderate(report,status){if(status==='REMOVED'&&!confirm('Remover a publicação denunciada?'))return;try{await api.patch(`/admin/reports/${report.id}`,{status});notice.value='Denúncia analisada.';await load()}catch(err){error.value=err.message}}
async function addVenue(){busy.value=true;error.value='';try{await api.post('/admin/venues',venueForm.value);venueForm.value={name:'',city:'',state:'SC',address:'',latitude:'',longitude:''};notice.value='Local cadastrado.';await load()}catch(err){error.value=err.message}finally{busy.value=false}}
</script>
<template>
 <div class="page-top city-top"><div class="container"><span class="kicker light">✦ GESTÃO DE EVENTOS</span><h1>Painel do <em>organizador.</em></h1><p>Cadastre locais, publique a programação e crie lotes de ingressos.</p></div></div>
 <div class="container work-area">
  <p class="notice-inline">{{isAdmin?'Administração do catálogo Alfred.':'Gerencie os eventos e lotes da sua empresa.'}}</p>
  <p v-if="error" role="alert" class="notice-error">{{error}}</p><p v-if="notice" role="status" class="notice-success">{{notice}}</p>
  <form v-if="needsCnpj" class="work-card work-form" @submit.prevent="completeCompany"><h2>Complete o cadastro da empresa</h2><label>CNPJ<input v-model="cnpj" class="form-control" maxlength="18" required/></label><button class="button button-primary" :disabled="busy">Salvar CNPJ</button></form>
  <template v-else><p v-if="loading">Carregando painel...</p>
  <div v-else-if="isAdmin" class="stat-grid"><div v-for="(value,key) in stats" :key="key" class="stat-box"><span>{{ ({events:'Eventos',venues:'Locais',users:'Usuários',reservations:'Reservas ativas'})[key]||key }}</span><strong>{{value}}</strong></div></div>
  <form v-if="isAdmin" class="work-card work-form" @submit.prevent="checkIn"><h2>Validar entrada</h2><label>Evento<select class="form-control" v-model="checkEvent" required><option disabled value="">Selecione</option><option v-for="e in events" :key="e.id" :value="e.id">{{e.title}}</option></select></label><label>Código lido do QR<input class="form-control" v-model="checkCode" required/></label><button class="button button-dark" :disabled="busy">Confirmar entrada</button></form><div class="work-grid">
   <section class="work-card"><span class="kicker">01 / PROGRAMAÇÃO</span><h2>{{editing?'Editar evento':'Novo evento'}}</h2>
    <form @submit.prevent="saveEvent" class="work-form"><label>Título<input class="form-control" v-model="form.title" required minlength="3" maxlength="180"/></label>
    <label>Descrição<textarea class="form-control" v-model="form.description" required minlength="10" rows="3"/></label>
    <label>Categoria<select v-model="form.category" class="form-control"><option v-for="c in CATEGORIES" :key="c.slug" :value="c.slug">{{c.label}}</option></select></label>
    <label>Local<select v-model="form.venueId" class="form-control" required><option value="" disabled>Selecione</option><option v-for="v in venues" :key="v.id" :value="v.id">{{v.name}} · {{v.city}}</option></select></label>
    <label>Data e horário<input class="form-control" v-model="form.startAt" type="datetime-local" required/></label>
    <label>Gêneros (separados por vírgula)<input class="form-control" v-model="form.genres" placeholder="rock, indie"/></label>
    <label>Artistas (separados por vírgula)<input class="form-control" v-model="form.performers" placeholder="Banda Exemplo"/></label>
    <label>Cor do tema<input class="form-control" v-model="form.accent" placeholder="violet" maxlength="30"/></label>
    <label class="inline-check"><input type="checkbox" v-model="form.isPublished"/> Publicar o evento</label>
    <div class="actions"><button class="button button-primary" :disabled="busy">{{busy?'Salvando...':editing?'Atualizar evento':'Criar evento'}}</button><button type="button" class="button button-outline" @click="reset">Limpar</button></div></form>
   </section>
   <section class="work-card"><span class="kicker">02 / LOCAIS E LOTES</span><h2>Cadastrar local</h2>
    <form class="work-form" @submit.prevent="addVenue"><label>Nome do espaço<input class="form-control" v-model="venueForm.name" required/></label><label>Cidade<input class="form-control" v-model="venueForm.city" required/></label><label>UF<input class="form-control" v-model="venueForm.state" required maxlength="2" pattern="[A-Z]{2}"/></label><label>Endereço<input class="form-control" v-model="venueForm.address" required/></label><label>Latitude (opcional)<input class="form-control" v-model="venueForm.latitude" type="number" min="-90" max="90" step="0.0000001" placeholder="-26.3044000"/></label><label>Longitude (opcional)<input class="form-control" v-model="venueForm.longitude" type="number" min="-180" max="180" step="0.0000001" placeholder="-48.8487000"/></label><button class="button button-dark" :disabled="busy">Salvar local</button></form>
    <div class="work-divider"></div><h2>Adicionar lote</h2><p>Selecione “Editar” em um evento cadastrado para inserir lotes.</p><form class="work-form" @submit.prevent="addLot"><label>Evento selecionado<input class="form-control" :value="edited?.title||'Nenhum evento selecionado'" disabled/></label><label>Nome do lote<input class="form-control" v-model="lotForm.name" required/></label><label>Preço ilustrativo (R$)<input class="form-control" v-model.number="lotForm.price" type="number" min="0" step="0.01" required/></label><label>Quantidade disponível<input class="form-control" v-model.number="lotForm.available" type="number" min="0" required/></label><button class="button button-dark" :disabled="!editing||busy">Adicionar lote</button></form>
   </section>
  </div>
  <section class="work-card"><span class="kicker">03 / AGENDA GERENCIÁVEL</span><h2>Eventos cadastrados</h2>
   <div class="admin-events"><article v-for="event in events" :key="event.id" class="admin-event"><div><strong>{{event.title}}</strong><small>{{dateParts(event.startAt).full}} · {{event.venue?.city}} · {{event.lots?.length||0}} lotes · {{event.isPublished?'Publicado':'Rascunho'}}</small><small v-if="event.lots?.length">{{event.lots.map(l=>l.name+' ('+brl(l.price)+')').join(' · ')}}</small></div><div class="actions"><button class="button button-outline button-small" @click="edit(event)">Editar / lotes</button><button class="button button-outline button-small" @click="toggle(event)">{{event.isPublished?'Despublicar':'Publicar'}}</button></div></article></div>
  </section>
  <section v-if="isAdmin" class="work-card" style="margin-top:20px"><span class="kicker">04 / MODERAÇÃO DO MOMENTS</span><h2>Denúncias pendentes</h2><p v-if="!reports.length">Nenhuma denúncia pendente.</p><article v-for="report in reports" :key="report.id" class="admin-event"><div><strong>Publicação #{{report.postId}}</strong><p>{{report.reason}}</p><small>{{report.post?.caption?.slice(0,160)}}</small></div><div class="actions"><button class="button button-outline button-small" @click="moderate(report,'DISMISSED')">Arquivar</button><button class="button button-outline button-small" @click="moderate(report,'REMOVED')">Remover publicação</button></div></article></section>
 </template></div>
</template>
<style scoped>
.work-area{padding-top:38px;padding-bottom:70px}.stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:24px 0}.stat-box,.work-card{padding:26px;border:1px solid #ddd9e6;border-radius:18px;background:#fff}.stat-box span,.stat-box strong{display:block}.stat-box strong{font-size:34px;margin-top:10px}.work-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}.work-card h2{font-size:26px;margin:12px 0 18px}.work-form{display:grid;gap:14px}.work-form label{display:grid;gap:7px;font-weight:600;font-size:14px}.work-form .inline-check{display:flex;align-items:center}.work-form .inline-check input{width:auto}.actions{display:flex;flex-wrap:wrap;gap:10px}.work-divider{height:1px;background:#eee;margin:28px 0}.admin-event{padding:17px 0;border-top:1px solid #eee;display:flex;align-items:center;justify-content:space-between;gap:15px}.admin-event small{display:block;color:#666;margin-top:5px}@media(max-width:800px){.work-grid{grid-template-columns:1fr}.stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-event{align-items:flex-start;flex-direction:column}}
</style>
