<script setup>
import {ref,onMounted,watch} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import api from '../services/api'
const route=useRoute(),router=useRouter(),auth=useAuthStore(),user=ref(null),posts=ref([]),error=ref(''),notice=ref('')
async function load(){error.value='';try{user.value=(await api.get(`/users/${encodeURIComponent(route.params.username)}`)).data;posts.value=user.value.canSeePosts?(await api.get(`/users/${encodeURIComponent(route.params.username)}/posts`)).data:[]}catch(e){error.value=e.message}}
onMounted(load);watch(()=>route.params.username,load)
async function follow(){if(!auth.token){router.push('/login');return}try{if(user.value.isFollowing)await api.delete(`/users/${user.value.username}/follow`);else await api.post(`/users/${user.value.username}/follow`);await load()}catch(e){error.value=e.message}}
async function block(){if(!confirm('Bloquear esta conta e remover conexões?'))return;try{await api.post(`/users/${user.value.username}/block`);notice.value='Conta bloqueada.';user.value=null;posts.value=[]}catch(e){error.value=e.message}}
</script>
<template><div class="page-top city-top"><div class="container"><span class="kicker light">✦ COMUNIDADE ALFRED</span><h1>Perfil e <em>momentos.</em></h1></div></div><div class="container profile-public"><p v-if="error" class="notice-error" role="alert">{{error}}</p><p v-if="notice" class="notice-success">{{notice}}</p><template v-if="user"><div class="work-card"><div class="profile-identity"><img v-if="user.avatarUrl" :src="user.avatarUrl" class="profile-avatar" alt=""/><div><h2>{{user.fullName}}</h2><p>@{{user.username}} <span v-if="user.isPrivate">· Perfil privado</span></p><p>{{user.bio}}</p><p v-if="user.preferredCity">{{user.preferredCity}}</p><p v-if="user.interests?.length">{{user.interests.join(' · ')}}</p><div v-if="user.favorites?.length"><h3>Eventos favoritos</h3><p v-for="e in user.favorites" :key="e.id">{{e.title}}</p></div><p>{{user.followers}} seguidores · {{user.following}} seguindo</p></div></div><div v-if="user.isMine" class="moment-actions owner-actions">
 <router-link class="button button-primary" :to="{name:'moments',query:{publicar:'perfil'}}">Criar publicação</router-link>
 <router-link class="button button-outline" to="/perfil/editar">Editar perfil</router-link>
 </div><div v-else class="moment-actions"><button class="button button-primary" :disabled="user.isPrivate&&!user.isFollowing" @click="follow">{{user.isFollowing?'Deixar de seguir':user.isPrivate?'Perfil privado':'Seguir'}}</button><button v-if="auth.token" class="button button-outline" @click="block">Bloquear</button></div></div><div v-if="!user.canSeePosts" class="empty-state"><h3>Este perfil é privado.</h3><p>As publicações não estão disponíveis para você.</p></div><div v-else><h2>Publicações</h2><article v-for="post in posts" :key="post.id" class="moment-card"><p>{{post.caption}}</p><img v-if="post.imageUrl" class="moment-photo" :src="post.imageUrl" alt="Foto da publicação" loading="lazy"/><small>{{post.likesCount}} curtidas · {{new Date(post.createdAt).toLocaleDateString('pt-BR')}}</small></article><p v-if="!posts.length">Este perfil ainda não publicou momentos.</p></div></template></div></template>

<style scoped>
.profile-identity {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1rem;
}
.profile-identity .profile-avatar {
  display: block;
  width: 6rem;
  height: 6rem;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
}
.profile-identity > div { min-width: 0; overflow-wrap: anywhere; }
.profile-identity h2 { margin: 0 0 .35rem; line-height: 1.15; }
.profile-identity p { margin: .25rem 0; }
.profile-identity p:empty { display: none; }
@media (max-width: 600px) {
  .profile-identity { gap: .75rem; }
  .profile-identity .profile-avatar { width: 4rem; height: 4rem; }
  .profile-identity h2 { font-size: 1.5rem; }
}
</style>
