<script setup>
import {ref,onMounted,onBeforeUnmount} from 'vue'
import {useAuthStore} from '../stores/auth'
import {usePreferences} from '../stores/preferences'
import api from '../services/api'
import CityPicker from '../components/CityPicker.vue'
import {GENRES,CATEGORIES} from '../utils'
const auth=useAuthStore(),pref=usePreferences(),busy=ref(false),message=ref(''),error=ref('')
const blockedUsers=ref([])
onMounted(async()=>{try{blockedUsers.value=(await api.get('/social/blocked')).data}catch(e){error.value=e.message}})
async function unblock(username){
 try{await api.delete('/users/'+encodeURIComponent(username)+'/block');blockedUsers.value=blockedUsers.value.filter(u=>u.username!==username)}catch(e){error.value=e.message}
}
const fields=ref({fullName:'',preferredCity:'',bio:'',avatarUrl:'',isPrivate:false,interests:[],musicGenres:[]})
const INTERESTS=[...GENRES.map(g=>({slug:g.slug,label:g.label})),...CATEGORIES.map(c=>({slug:c.slug,label:c.label}))]
const uniqueInterests=INTERESTS.filter((v,i,arr)=>arr.findIndex(x=>x.slug===v.slug)===i)
onMounted(async()=>{try{const res=await api.get('/me');auth.user=res.data;localStorage.setItem('user',JSON.stringify(res.data));fields.value={fullName:res.data.fullName,preferredCity:res.data.preferredCity||'',bio:res.data.bio||'',avatarUrl:res.data.avatarUrl||'',showCity:!!res.data.showCity,isPrivate:!!res.data.isPrivate,interests:res.data.interests||[],musicGenres:res.data.musicGenres||[]}}catch(e){error.value=e.message}})
const selectedPhoto=ref(null),photoInput=ref(null),preview=ref(''),removed=ref(false)
function clearSelection(){
 if(preview.value)URL.revokeObjectURL(preview.value)
 preview.value='';selectedPhoto.value=null
 if(photoInput.value)photoInput.value.value=''
}
onBeforeUnmount(clearSelection)
function choosePhoto(event){
 const file=event.target.files?.[0]
 if(!file)return
 clearSelection();error.value='';message.value=''
 if(file.size>512000){error.value='Escolha uma foto de até 500 KB.';return}
 selectedPhoto.value=file;preview.value=URL.createObjectURL(file);removed.value=false
}
function removePhoto(){clearSelection();removed.value=true}
function encodePhoto(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader()
  reader.onload=()=>resolve(reader.result.split(',')[1])
  reader.onerror=()=>reject(Error('Não foi possível ler a foto.'))
  reader.readAsDataURL(file)
 })
}
function toggle(value){const arr=fields.value.interests;fields.value.interests=arr.includes(value)?arr.filter(x=>x!==value):[...arr,value]}
async function save(){busy.value=true;error.value='';message.value='';try{
 const {avatarUrl,...payload}=fields.value
 if(selectedPhoto.value)payload.avatarPhoto=await encodePhoto(selectedPhoto.value)
 else if(removed.value)payload.avatarUrl=null
 const res=await api.patch('/profile',payload);auth.user=res.data;localStorage.setItem('user',JSON.stringify(res.data));pref.setCity(fields.value.preferredCity);pref.setGenres(fields.value.musicGenres);fields.value.avatarUrl=res.data.avatarUrl;clearSelection();removed.value=false;message.value='Perfil atualizado.'
}catch(e){error.value=e.message}finally{busy.value=false}}
</script>
<template><div class="page-top city-top"><div class="container"><span class="kicker light">✦ SUA CONTA</span><h1>Seu espaço no <em>Alfred.</em></h1></div></div><div class="container profile-public"><section class="work-card"><span class="kicker">PERFIL E PRIVACIDADE</span><h2>Editar suas informações</h2><p>{{auth.user?.email}} · <router-link v-if="auth.user" :to="`/p/${auth.user.username}`">Visualizar perfil público ↗</router-link></p><form @submit.prevent="save" class="profile-form"><label>Nome de exibição<input class="form-control" v-model="fields.fullName" required minlength="2" maxlength="120"/></label><label>Minha cidade<CityPicker v-model="fields.preferredCity"/></label><label><input type="checkbox" v-model="fields.showCity"/> Exibir cidade no perfil público</label><label>Biografia<textarea class="form-control" v-model="fields.bio" maxlength="500" rows="3" placeholder="Um pouco sobre você..."/></label><div><img v-if="!removed && (preview || fields.avatarUrl)" :src="preview || fields.avatarUrl" alt="Foto de perfil" class="profile-avatar"/><label>Foto de perfil<input class="form-control" type="file" ref="photoInput" accept="image/jpeg,image/png,image/webp" :disabled="busy" @change="choosePhoto"/></label><small>JPEG, PNG ou WebP de até 500 KB.</small><button v-if="!removed && (preview || fields.avatarUrl)" type="button" class="subtle-button" :disabled="busy" @click="removePhoto">Remover foto</button></div><label class="profile-check"><input type="checkbox" v-model="fields.isPrivate"/> Perfil privado (restringe a visualização das publicações)</label><h3>O que você curte?</h3><p>Esses interesses ajudam o Alfred Match a recomendar experiências.</p><div class="genre-grid"><button type="button" v-for="item in uniqueInterests" :key="item.slug" class="genre-button" :class="{selected:fields.interests.includes(item.slug)}" @click="toggle(item.slug)">{{item.label}} {{fields.interests.includes(item.slug)?'✓':'+'}}</button></div><h3>Gêneros musicais</h3><div class="genre-grid"><label v-for="g in GENRES" :key="g.slug" class="profile-check"><input type="checkbox" v-model="fields.musicGenres" :value="g.slug"/> {{g.label}}</label></div><button class="button button-primary" :disabled="busy">{{busy?'Salvando...':'Salvar perfil e interesses'}}</button></form><p v-if="message" class="notice-success" role="status">{{message}}</p><p v-if="error" class="notice-error" role="alert">{{error}}</p><div v-if="blockedUsers.length"><h3>Contas bloqueadas</h3><p v-for="u in blockedUsers" :key="u.username">@{{u.username}} <button class="subtle-button" @click="unblock(u.username)">Desbloquear</button></p></div><p>Você também pode gerenciar <router-link to="/favoritos">eventos salvos</router-link>, <router-link to="/meus-ingressos">reservas simuladas</router-link> e <router-link to="/seu-ritmo">preferências musicais</router-link>.</p></section></div></template>
