const publicUser=u=>({
  id:u.id,username:u.username,fullName:u.fullName,email:u.email,showCity:!!u.showCity,preferredCity:u.preferredCity,
  bio:u.bio||'',avatarUrl:u.avatarUrl||null,isPrivate:!!u.isPrivate,
  interests:u.interests||[],musicGenres:u.musicGenres||[],musicArtists:u.musicArtists||[],isAdmin:!!u.isAdmin,isOrganizer:!!u.isOrganizer,hasCnpj:!!u.cnpj
});
const summary=u=>({id:u.id,username:u.username,fullName:u.fullName,bio:u.isPrivate?'':u.bio||'',avatarUrl:u.avatarUrl||null,preferredCity:u.showCity&&!u.isPrivate?u.preferredCity:null,isPrivate:!!u.isPrivate});
module.exports={publicUser,summary};
