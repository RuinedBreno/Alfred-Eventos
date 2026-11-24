function isSafeImageUrl(value){
 if(typeof value!=='string'||value.length>500)return false;
 try{const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password && !['localhost','127.0.0.1','::1'].includes(url.hostname.toLowerCase())}
 catch{return false}
}
module.exports={isSafeImageUrl};
