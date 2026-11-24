<script setup>
import {ref,onMounted} from 'vue'
import {useRoute,useRouter} from 'vue-router'
const route=useRoute(), router=useRouter(), captionField=ref(null)
onMounted(()=>{if(route.query.publicar==='perfil')captionField.value?.focus()})
import {useAuthStore} from '../stores/auth'
import api from '../services/api'
const auth=useAuthStore(),posts=ref([]),error=ref(''),notice=ref(''),loading=ref(false),busy=ref(false)
const caption=ref(''),imageUrl=ref(''),eventId=ref(''),comments=ref({}),page=ref(1)
async function load(reset=true){loading.value=true;error.value='';try{
 if(reset)page.value=1
 const response=await api.get('/social/feed',{params:{page:page.value}})
 posts.value=reset?response.data:[...posts.value,...response.data]
}catch(e){error.value=e.message}finally{loading.value=false}}
onMounted(load)
const photoFile=ref(null)
async function encodePhoto(file){
 if(!file)return null
 if(file.size>512000)throw Error('Escolha uma imagem de até 500 KB.')
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('Falha ao ler imagem.'));reader.readAsDataURL(file)})
}
async function publish(){error.value='';notice.value='';busy.value=true;try{
 await api.post('/social/posts',{photo:await encodePhoto(photoFile.value?.files[0]),caption:caption.value,imageUrl:imageUrl.value||null,eventId:eventId.value?Number(eventId.value):null})
 if(photoFile.value)photoFile.value.value=''
 caption.value='';imageUrl.value='';eventId.value='';notice.value='Momento publicado.'
 if(route.query.publicar==='perfil')await router.push({name:'profile'})
 else await load()
}catch(e){error.value=e.message}finally{busy.value=false}}
async function toggleLike(post){if(!auth.token){error.value='Entre para curtir as publicações.';return}try{
 if(post.likedByMe)await api.delete(`/social/posts/${post.id}/like`);else await api.post(`/social/posts/${post.id}/like`)
 post.likedByMe=!post.likedByMe;post.likesCount+=post.likedByMe?1:-1
}catch(e){error.value=e.message}}
async function comment(post){const content=comments.value[post.id]?.trim();if(!content)return;try{
 await api.post(`/social/posts/${post.id}/comments`,{content});comments.value[post.id]='';await load()
}catch(e){error.value=e.message}}
async function removePost(post){if(!confirm('Excluir permanentemente sua publicação?'))return;try{await api.delete(`/social/posts/${post.id}`);posts.value=posts.value.filter(x=>x.id!==post.id)}catch(e){error.value=e.message}}
async function removeComment(comment){if(!confirm('Excluir comentário?'))return;try{await api.delete(`/social/comments/${comment.id}`);await load()}catch(e){error.value=e.message}}
async function report(post){const reason=prompt('Por que deseja denunciar esta publicação? (mínimo de 5 caracteres)');if(!reason)return;try{await api.post(`/social/posts/${post.id}/report`,{reason});notice.value='Denúncia registrada para análise.'}catch(e){error.value=e.message}}
async function nextPage(){page.value++;await load(false)}
</script>
<template>
 <div class="page-top city-top"><div class="container"><span class="kicker light">✦ ALFRED MOMENTS</span><h1>Experiências que viram <em>histórias.</em></h1><p>Compartilhe momentos e descubra o que a comunidade está vivendo.</p></div></div>
 <div class="container moments-layout"><div>
  <section v-if="auth.token" class="moments-compose"><span class="kicker">SEU MOMENTO</span><h2>Conte o que viveu</h2><form @submit.prevent="publish" class="moments-form"><label>Legenda<textarea class="form-control" ref="captionField" v-model="caption" minlength="1" maxlength="2000" rows="4" placeholder="Compartilhe sua experiência..." required/></label><label>Foto do dispositivo (até 500 KB)<input type="file" ref="photoFile" accept="image/jpeg,image/png,image/webp"/></label><label>URL de imagem (HTTPS, opcional)<input class="form-control" v-model="imageUrl" type="url" placeholder="https://..."/></label><label>ID do evento (opcional)<input class="form-control" v-model="eventId" type="number" min="1" placeholder="Ex.: 4"/></label><button class="button button-primary" :disabled="busy">{{busy?'Publicando...':'Publicar Momento'}}</button></form><small class="help-text">A foto selecionada tem prioridade sobre a URL.</small></section>
  <section v-else class="moments-compose"><h2>Faça parte do Alfred Moments</h2><p>Entre na sua conta para publicar fotos, curtir e comentar.</p><router-link to="/login" class="button button-primary">Entrar</router-link></section>
  <p v-if="notice" class="notice-success" role="status">{{notice}}</p><p v-if="error" class="notice-error" role="alert">{{error}}</p>
  <div v-if="loading && !posts.length">Carregando momentos...</div>
  <article v-for="post in posts" :key="post.id" class="moment-card"><div class="moment-head"><router-link :to="`/p/${post.author.username}`" class="moment-author"><img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" alt="" class="moment-avatar" referrerpolicy="no-referrer"/><span v-else class="moment-avatar moment-initial">{{post.author.fullName.slice(0,1)}}</span><span><strong>{{post.author.fullName}}</strong><small>@{{post.author.username}} · {{new Date(post.createdAt).toLocaleDateString('pt-BR')}}</small></span></router-link><div class="moment-actions"><button v-if="post.author.id===auth.user?.id" class="subtle-button" @click="removePost(post)">Excluir</button><button v-else-if="auth.token" class="subtle-button" @click="report(post)">Denunciar</button></div></div>
   <p class="moment-caption">{{post.caption}}</p><img v-if="post.imageUrl" class="moment-photo" :src="post.imageUrl" alt="Foto publicada na comunidade" loading="lazy" referrerpolicy="no-referrer"/>
   <router-link v-if="post.event" :to="`/evento/${post.event.id}`" class="moment-event">✦ {{post.event.title}}</router-link>
   <div class="moment-interactions"><button class="subtle-button" :aria-pressed="post.likedByMe" @click="toggleLike(post)">{{post.likedByMe?'♥':'♡'}} {{post.likesCount}} curtida(s)</button><span>{{post.comments.length}} comentário(s)</span></div>
   <div class="moment-comments"><div v-for="c in post.comments" :key="c.id" class="moment-comment"><p><router-link :to="`/p/${c.author.username}`"><strong>@{{c.author.username}}</strong></router-link> {{c.content}}</p><button v-if="c.isMine||post.author.id===auth.user?.id" class="subtle-button" @click="removeComment(c)">Excluir</button></div>
   <form v-if="auth.token" class="moment-comment-form" @submit.prevent="comment(post)"><input class="form-control" v-model="comments[post.id]" maxlength="600" placeholder="Escreva um comentário..." required/><button class="button button-outline button-small">Enviar</button></form></div></article>
  <div v-if="!loading&&!posts.length" class="empty-state"><h3>Nenhum Momento ainda.</h3><p>Seja a primeira pessoa a compartilhar uma experiência!</p></div>
  <button v-if="posts.length>=page*20" class="button button-outline" @click="nextPage" :disabled="loading">Ver mais momentos</button>
 </div><aside class="moments-aside"><span class="kicker">ALFRED MOMENTS</span><h3>Compartilhe com responsabilidade.</h3><p>Respeite outras pessoas, publique apenas imagens de que tenha autorização e denuncie conteúdo inadequado.</p><p>Perfis privados têm publicações restritas. O bloqueio impede a interação entre contas.</p></aside></div>
</template>
