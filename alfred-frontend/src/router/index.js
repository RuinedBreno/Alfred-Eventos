import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import CityView from '../views/CityView.vue'
import RhythmView from '../views/RhythmView.vue'
import EventView from '../views/EventView.vue'
import OrdersView from '../views/OrdersView.vue'
import AuthView from '../views/AuthView.vue'
import SpotifyCallbackView from '../views/SpotifyCallbackView.vue'
import AdminView from '../views/AdminView.vue'
import ProfileView from '../views/ProfileView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import MomentsView from '../views/MomentsView.vue'
import PublicProfileView from '../views/PublicProfileView.vue'
const routes=[
 {path:'/',name:'home',component:HomeView},
 {path:'/momentos',name:'moments',component:MomentsView},
 {path:'/p/:username',name:'public-profile',component:PublicProfileView},
 {path:'/cidade',name:'city',component:CityView},
 {path:'/seu-ritmo',name:'rhythm',component:RhythmView},
 {path:'/evento/:id',name:'event',component:EventView},
 {path:'/meus-ingressos',name:'orders',component:OrdersView},
 {path:'/favoritos',name:'favorites',component:FavoritesView,meta:{requiresAuth:true}},
 {path:'/perfil',name:'profile',redirect:()=>{
   const auth=useAuthStore()
   return auth.token && auth.user?.username
     ? {name:'public-profile',params:{username:auth.user.username}}
     : {name:'login',query:{redirect:'/perfil'}}
 }},
 {path:'/perfil/editar',name:'edit-profile',component:ProfileView,meta:{requiresAuth:true}},
 {path:'/admin',name:'admin',component:AdminView,meta:{requiresAuth:true,requiresEventManager:true}},
 {path:'/login',name:'login',component:AuthView},
 {path:'/empresas/cadastro',name:'register-company',component:AuthView},
 {path:'/cadastro',name:'register',component:AuthView},
 {path:'/spotify/callback',name:'spotify-callback',component:SpotifyCallbackView},
 {path:'/:pathMatch(.*)*',redirect:'/'}
]
const router=createRouter({history:createWebHistory(),routes,scrollBehavior:()=>({top:0})})
router.beforeEach(to=>{const auth=useAuthStore();if(to.meta.requiresAuth && !auth.token)return {name:'login',query:{redirect:to.fullPath}};if(to.meta.requiresEventManager && !(auth.user?.isAdmin || auth.user?.isOrganizer))return {name:'home'}})
export default router
