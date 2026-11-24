module.exports={name:'interesses',score(event,profile){
 const set=new Set((profile.interests||[]).map(x=>String(x).toLowerCase()));
 if(!set.size)return 0;
 const category=String(event.category||'').toLowerCase();
 return set.has(category)?10:0;
}};
