const token=import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN
export const hasAppleConfig=Boolean(token)
let loading
async function loadMusicKit(){
 if(!window.MusicKit && !loading){
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script')
   script.src='https://js-cdn.music.apple.com/musickit/v3/musickit.js'
   const ready=()=>resolve()
   document.addEventListener('musickitloaded',ready,{once:true})
   script.onerror=()=>{document.removeEventListener('musickitloaded',ready);loading=null;script.remove();reject(new Error('Falha ao carregar o Apple Music.'))}
   document.head.append(script)
  })
 }
 if(!window.MusicKit) await loading
 return window.MusicKit
}
export async function connectApple(){
 if(!token)throw new Error('Configure o token de desenvolvedor do Apple Music no frontend.')
 const kit=await loadMusicKit()
 await kit.configure({developerToken:token,app:{name:'Alfred',build:'2.0'}})
 const userToken=await kit.getInstance().authorize()
 const response=await fetch('https://api.music.apple.com/v1/me/library/artists?limit=20',{headers:{Authorization:'Bearer '+token,'Music-User-Token':userToken}})
 if(!response.ok)throw new Error('A biblioteca do Apple Music está indisponível.')
 const result=await response.json()
 return result.data.map(artist=>({name:artist.attributes.name}))
}
