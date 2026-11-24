<script setup>
import {ref,onMounted} from 'vue'
import api from '../services/api'
import EventCard from '../components/EventCard.vue'
const favorites=ref([]),loading=ref(true),error=ref('')
async function load(){loading.value=true;try{favorites.value=(await api.get('/favorites')).data}catch(e){error.value=e.message}finally{loading.value=false}}
onMounted(load)
async function remove(id){try{await api.delete(`/favorites/${id}`);favorites.value=favorites.value.filter(f=>f.eventId!==id)}catch(e){error.value=e.message}}
</script>
<template><div class="page-top tickets-top"><div class="container"><span class="kicker light">✦ SUA LISTA</span><h1>Eventos <em>salvos.</em></h1><p>Guarde experiências para decidir depois.</p></div></div>
<div class="container" style="padding-top:35px;padding-bottom:75px"><p v-if="error" class="notice-error" role="alert">{{error}}</p><p v-if="loading">Carregando...</p><div v-else-if="favorites.length" class="events-grid"><div v-for="favorite in favorites" :key="favorite.id"><EventCard v-if="favorite.event" :event="favorite.event"/><button class="subtle-button" @click="remove(favorite.eventId)">Remover dos salvos ✕</button></div></div><div v-else class="empty-state"><h2>Nada salvo por enquanto.</h2><router-link class="button button-dark" to="/">Descobrir eventos ↗</router-link></div></div></template>
