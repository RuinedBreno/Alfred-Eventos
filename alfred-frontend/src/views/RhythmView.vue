<script setup>
import { ref,computed,onMounted,watch } from 'vue'
import { usePreferences } from '../stores/preferences'
import { listEvents,listRecommendations } from '../services/events'
import { GENRES, CITIES } from '../utils'
import {connectApple,hasAppleConfig} from '../services/appleMusic'
import { connectSpotify,hasSpotifyConfig } from '../services/spotify'
import EventCard from '../components/EventCard.vue'
import CityPicker from '../components/CityPicker.vue'
import api from '../services/api'
import {useAuthStore} from '../stores/auth'
const auth=useAuthStore(),pref=usePreferences(), events=ref([]),serverMatches=ref(null),demo=ref(false),message=ref(''), busy=ref(false)
const selected=computed(()=>pref.genres)
async function toggle(slug){const next=selected.value.includes(slug)?selected.value.filter(g=>g!==slug):[...selected.value,slug];pref.setGenres(next);if(auth.token){try{await api.patch('/profile',{musicGenres:next})}catch(e){message.value='Gêneros salvos neste navegador; não foi possível sincronizar com a API.'}}}
onMounted(async()=>{try{if(auth.token){const me=(await api.get('/me')).data;if(Array.isArray(me.musicGenres)&&me.musicGenres.length)pref.setGenres(me.musicGenres)}const r=await listEvents();events.value=r.data;demo.value=r.demo;await refreshMatches()}catch(e){message.value=e.message}})
async function refreshMatches(){const genres=pref.genres.join(','),artists=pref.spotifyArtists.map(a=>a.name).slice(0,20).join(',');try{serverMatches.value=await listRecommendations({city:pref.city,genres,artists})}catch{serverMatches.value=null}}
watch([()=>pref.genres,()=>pref.city,()=>pref.spotifyArtists],refreshMatches)
const localRanked=computed(()=>events.value.filter(e=>['shows','baladas','cultura','danca'].includes(e.category) && (!pref.city || e.venue?.city===pref.city)).map(e=>{
 const tags=Array.isArray(e.genres)?e.genres:[]
 const matches=tags.filter(tag=>selected.value.includes(tag)).length
 const genreScore=selected.value.length?Math.round(50*matches/selected.value.length):0
 const selectedArtists=pref.spotifyArtists.map(a=>a.name.toLowerCase())
 const artists=Array.isArray(e.performers)?e.performers:[]
 const artistHits=artists.filter(name=>selectedArtists.includes(name.toLowerCase())).length
 const artistScore=selectedArtists.length?Math.round(30*artistHits/selectedArtists.length):0
 const interestScore=auth.user?.interests?.includes(e.category)?10:0
 const cityScore=pref.city&&e.venue?.city===pref.city?5:0
 return {event:e,score:Math.min(100,genreScore+artistScore+interestScore+cityScore)}
}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||new Date(a.event.startAt)-new Date(b.event.startAt)))
const ranked=computed(()=>serverMatches.value===null?localRanked.value:serverMatches.value)
const artistNames=computed(()=>pref.spotifyArtists.slice(0,6).map(a=>a.name).join(', '))
async function apple(){
 busy.value=true;message.value=''
 try{
  const artists=await connectApple()
  pref.setSpotify(artists,[])
  if(auth.token)await api.patch('/profile',{musicArtists:artists.map(a=>a.name)})
  message.value=artists.length?'Artistas do Apple Music importados.':'A biblioteca está vazia.'
 }catch(e){message.value=e.message}finally{busy.value=false}
}
async function disconnect(){
 try{
  if(window.MusicKit?.getInstance()?.isAuthorized)await window.MusicKit.getInstance().unauthorize()
  if(auth.token)await api.patch('/profile',{musicArtists:[]})
  pref.clearSpotify()
 }catch(e){message.value=e.message}
}
async function spotify(){message.value='';busy.value=true;try{await connectSpotify()}catch(e){message.value=e.message;busy.value=false}}
</script>
<template>
 <div class="page-top rhythm-top"><div class="container rhythm-head"><span class="kicker light">✦ ALFRED SOUND MATCH</span><h1>Encontre eventos na <em>sua frequência.</em></h1><p>Seu próximo show favorito pode estar a poucos quilômetros. Conte o que você ouve para que a gente encontre experiências semelhantes.</p><div class="wave-decor" aria-hidden="true">♫ ♪ ♫</div></div></div>
 <div class="container rhythm-layout"><div class="rhythm-preferences"><span class="step-tag">01 / DESCUBRA SUA VIBE</span><h2>Qual é a trilha sonora da sua vida?</h2><p>Selecione os estilos que você mais curte. As recomendações são calculadas com base nos gêneros cadastrados pelos organizadores.</p><div class="genre-grid"><button v-for="genre in GENRES" :key="genre.slug" class="genre-button" :class="{selected:selected.includes(genre.slug)}" :aria-pressed="selected.includes(genre.slug)" @click="toggle(genre.slug)">{{genre.label}} <span>{{selected.includes(genre.slug)?'✓':'+'}}</span></button></div>
 <div class="connect-panel"><span class="step-tag">02 / CONECTE SUA MÚSICA (OPCIONAL)</span><h3>Deixe sua música falar por você.</h3><p>O Spotify pode autorizar a leitura dos seus artistas e faixas mais ouvidos. Você poderá desconectar a qualquer momento.</p>
 <div class="music-connect-actions"><button class="button spotify-button" @click="spotify" :disabled="busy">♫ {{busy?'Conectando...':hasSpotifyConfig?'Conectar Spotify':'Configurar Spotify'}} <span>↗</span></button><button class="button apple-button" :disabled="busy" @click="apple">♪ {{hasAppleConfig?'Conectar Apple Music':'Configurar Apple Music'}}</button></div>
 <small class="help-text">Conexão Spotify exige Client ID cadastrado e permissão de acesso ao app. Apple Music requer um token MusicKit e autorização da conta.</small>
 <div v-if="artistNames" class="connected-summary"><strong>Artistas musicais salvos:</strong> {{artistNames}}. <span>Selecione gêneros acima para refinar as recomendações.</span> <button class="subtle-button" @click="disconnect">Desconectar preferências importadas</button></div>
 <p v-if="message" role="alert" class="notice-error">{{message}}</p></div></div>
 <div class="rhythm-recommendations"><div class="section-heading"><div><span class="kicker">✦ O RESULTADO DA CONEXÃO</span><h2>Combina com seu ritmo</h2></div><div class="right-control"><label for="rhythm-city">Em</label><CityPicker :modelValue="pref.city" @update:modelValue="pref.setCity" placeholder="Todas as cidades"/><span class="result-counter">{{ranked.length}}</span></div></div>
 <div class="notice-inline">✳ Recomendações por correspondência de gêneros e artistas declarados nos eventos fictícios. O número indica compatibilidade de tags, não probabilidade de satisfação.</div><div v-if="ranked.length" class="events-grid"><EventCard v-for="item in ranked" :key="item.event.id" :event="item.event" :match="item.score"/></div><div v-else class="empty-state"><div class="empty-icon">♫</div><h3>Sua playlist de eventos começa aqui.</h3><p>Escolha um ou mais gêneros musicais acima para encontrar shows e baladas com estilos parecidos.</p></div></div></div>
</template>
