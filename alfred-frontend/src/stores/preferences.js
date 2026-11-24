import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from './auth'
const parse = (key,fallback) => { try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback} }

// Dados locais são separados por conta. Uma sessão de outro usuário não pode herdar
// artistas do Spotify ou reservas locais fictícias da pessoa anterior no mesmo navegador.
export const usePreferences = defineStore('preferences',()=>{
  const auth=useAuthStore()
  const key=name=>`${name}:${auth.user?.id?`user-${auth.user.id}`:'visitante'}`
  const read=(name,fallback)=>parse(key(name),fallback)
  const city=ref(read('alfred-city',''))
  const genres=ref(read('alfred-genres',[]))
  const spotifyArtists=ref(read('alfred-artists',[]))
  const spotifyTracks=ref(read('alfred-tracks',[]))
  const demoOrders=ref(read('alfred-demo-orders',[]))
  function setCity(value){city.value=value;localStorage.setItem(key('alfred-city'),JSON.stringify(value))}
  function setGenres(value){genres.value=value;localStorage.setItem(key('alfred-genres'),JSON.stringify(value))}
  function setSpotify(artists,tracks){spotifyArtists.value=artists;spotifyTracks.value=tracks;localStorage.setItem(key('alfred-artists'),JSON.stringify(artists));localStorage.setItem(key('alfred-tracks'),JSON.stringify(tracks))}
  function clearSpotify(){setSpotify([],[]);sessionStorage.removeItem('alfred_spotify_token')}
  function addDemoOrder(order){demoOrders.value=[order,...demoOrders.value];localStorage.setItem(key('alfred-demo-orders'),JSON.stringify(demoOrders.value))}
  function removeDemoOrder(id){demoOrders.value=demoOrders.value.filter(x=>x.id!==id);localStorage.setItem(key('alfred-demo-orders'),JSON.stringify(demoOrders.value))}
  watch(()=>auth.user?.id,()=>{
    city.value=read('alfred-city','')
    genres.value=read('alfred-genres',[])
    spotifyArtists.value=read('alfred-artists',[])
    spotifyTracks.value=read('alfred-tracks',[])
    demoOrders.value=read('alfred-demo-orders',[])
    sessionStorage.removeItem('alfred_spotify_token')
  })
  return {city,genres,spotifyArtists,spotifyTracks,demoOrders,removeDemoOrder,setCity,setGenres,setSpotify,clearSpotify,addDemoOrder}
})
