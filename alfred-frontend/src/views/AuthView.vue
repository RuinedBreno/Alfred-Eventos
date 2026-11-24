<script setup>
import {ref,computed} from 'vue'
import {useRouter,useRoute} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import {usePreferences} from '../stores/preferences'
import api from '../services/api'
import CityPicker from '../components/CityPicker.vue'
import {CATEGORIES,GENRES} from '../utils'
const router=useRouter(),route=useRoute(),auth=useAuthStore(),pref=usePreferences(),register=computed(()=>['register','register-company'].includes(route.name))
const company=computed(()=>route.name==='register-company')
const cnpj=ref('')
const fullName=ref(''),username=ref(''),email=ref(''),password=ref(''),error=ref(''),info=ref(''),busy=ref(false),interests=ref([]),preferredCity=ref('')
const options=[...CATEGORIES.map(x=>({slug:x.slug,label:x.label})),...GENRES.map(x=>({slug:x.slug,label:x.label}))]
function toggleInterest(slug){interests.value=interests.value.includes(slug)?interests.value.filter(x=>x!==slug):[...interests.value,slug]}
async function submit(){busy.value=true;error.value='';info.value='';try{
 if(register.value){await api.post('/register',{accountType:company.value?'company':'personal',...(company.value?{cnpj:cnpj.value}:{}),fullName:fullName.value,username:username.value,email:email.value,password:password.value,interests:interests.value,preferredCity:preferredCity.value});info.value='Conta criada. Faça login para continuar.';await router.push({name:'login',query:{...route.query,registered:'1'}});return}
 const result=await api.post('/login',{email:email.value,password:password.value});auth.setAuth(result.token,result.user)
 pref.setCity(result.user.preferredCity||'')
 pref.setGenres(result.user.musicGenres||[])
 if(result.user.musicArtists?.length)pref.setSpotify(result.user.musicArtists.map(name=>({name})),[])
 const redirect=typeof route.query.redirect==='string'&&route.query.redirect.startsWith('/')&&!route.query.redirect.startsWith('//')?route.query.redirect:(result.user.isOrganizer?'/admin':'/meus-ingressos')
 await router.push(redirect)
}catch(e){error.value=e.message||'Não foi possível concluir.'}finally{busy.value=false}}
</script>
<template><div class="container auth-layout"><div class="auth-welcome"><div class="eyebrow">✦ BEM-VINDO AO ALFRED</div><h1>Tem muita coisa boa <em>esperando por você.</em></h1><p>Entre para organizar suas experiências e salvar suas simulações de reserva.</p><div class="auth-abstract">✳</div></div><div class="auth-card"><span class="kicker">SUA CONTA</span><h2>{{register?(company?'Cadastro de empresa':'Cadastro pessoal'):'Que bom te ver de novo.'}}</h2><p>{{register?'Crie sua conta para acompanhar seus eventos.':'Acesse sua conta para continuar.'}}</p><div v-if="route.query.registered" class="notice-success" role="status">Cadastro realizado. Entre com seus dados.</div><form @submit.prevent="submit"><template v-if="register"><router-link :to="{name:company?'register':'register-company'}">{{company?'Criar conta pessoal':'Cadastrar minha empresa'}}</router-link><template v-if="company"><label for="cnpj" class="field-label">CNPJ</label><input id="cnpj" v-model="cnpj" class="form-control" maxlength="18" required placeholder="Com ou sem pontuação"/></template><label for="fullName" class="field-label">{{company?'Nome da empresa':'Nome completo'}}</label><input id="fullName" v-model="fullName" class="form-control" maxlength="120" required/><label for="username" class="field-label">Usuário</label><input id="username" v-model="username" class="form-control" minlength="3" maxlength="40" pattern="[A-Za-z0-9_]+" required/><label class="field-label">Sua cidade (opcional)</label><CityPicker v-model="preferredCity"/><template v-if="!company"><label class="field-label">Seus interesses (opcional)</label><div class="genre-grid auth-interests"><button v-for="interest in options" :key="interest.slug" type="button" class="genre-button" :aria-pressed="interests.includes(interest.slug)" :class="{selected:interests.includes(interest.slug)}" @click="toggleInterest(interest.slug)"><span>{{interest.label}}</span><span aria-hidden="true">{{interests.includes(interest.slug)?'✓':'+'}}</span></button></div></template></template><label for="email" class="field-label">E-mail</label><input id="email" v-model="email" type="email" class="form-control" required/><label for="password" class="field-label">Senha</label><input id="password" v-model="password" type="password" class="form-control" :minlength="register?8:1" required/><button class="button button-primary button-full" :disabled="busy">{{busy?'Aguarde...':register?'Criar minha conta':'Entrar'}} ↗</button><div v-if="error" class="notice-error" role="alert">{{error}}</div><div v-if="info" class="notice-success" role="status">{{info}}</div></form><p class="auth-swap" v-if="register">Já tem conta? <router-link :to="{name:'login',query:route.query}">Entrar</router-link></p><p class="auth-swap" v-else>Ainda não tem uma conta? <router-link :to="{name:'register',query:route.query}">Cadastrar</router-link></p><small class="help-text">O cadastro precisa de uma API Alfred ativa e um banco de dados configurado.</small></div></div></template>
<style scoped>
.auth-card { min-width:0; }
.auth-card .auth-interests { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr)); width:100%; gap:.5rem; box-sizing:border-box; }
.auth-card .auth-interests .genre-button { display:flex; align-items:center; justify-content:space-between; min-width:0; width:100%; padding:.65rem .75rem; gap:.4rem; box-sizing:border-box; }
.genre-button span:first-child { overflow-wrap:anywhere; }
.genre-button span:last-child { flex:none; }
</style>

