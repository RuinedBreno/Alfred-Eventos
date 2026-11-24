<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
const auth=useAuthStore(),router=useRouter()
function logout(){auth.clearAuth();router.push('/')}
</script>
<template>
  <div class="app-shell">
    <div class="demo-strip">PROJETO ACADÊMICO · Eventos e locais fictícios · Confira o tipo de reserva no checkout</div>
    <header class="site-header">
      <div class="header-inner container">
        <router-link class="brand" to="/" aria-label="Alfred, início"><span class="brand-glyph">a<span>.</span></span><span class="brand-name">alfred<span>.</span></span></router-link>
        <nav class="desktop-nav" aria-label="Principal"><router-link to="/">Explorar</router-link><router-link to="/cidade">Minha cidade</router-link><router-link to="/momentos">Moments</router-link><router-link to="/seu-ritmo">Seu ritmo <span class="tiny-star">✦</span></router-link></nav>
        <div class="header-actions">
          <router-link v-if="auth.token" to="/favoritos" class="nav-tickets">Salvos</router-link>
          <router-link v-if="auth.token" to="/perfil" class="nav-tickets">Perfil</router-link>
          <router-link v-if="auth.token && (auth.user?.isAdmin || auth.user?.isOrganizer)" to="/admin" class="nav-tickets">{{auth.user?.isAdmin?'Painel':'Meus eventos'}}</router-link>
          <router-link v-if="auth.token" to="/meus-ingressos" class="nav-tickets">Carteira</router-link>
          <router-link v-if="!auth.token" to="/login" class="button button-outline button-small">Entrar <span aria-hidden="true">↗</span></router-link>
          <button v-else class="button button-outline button-small" @click="logout">Sair</button>
        </div>
      </div>
    </header>
    <main><router-view :key="$route.path"/></main>
    <footer class="site-footer"><div class="container footer-inner"><div><span class="footer-brand">alfred.</span><p>A cidade tem planos para você.</p></div><div class="footer-right">Protótipo acadêmico Alfred 2.0: Radar · Match · Tickets · Moments · Wallet.<br/>Ambiente acadêmico de eventos. <span>© 2026 Alfred</span></div></div></footer>
  </div>
</template>
