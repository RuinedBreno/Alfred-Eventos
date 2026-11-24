const sharp=require('sharp');
const {AppError}=require('./errors');
async function preparePhoto(input, size=800){
 if(!input)return null;
 if(typeof input!=='string'||input.length>720000)throw new AppError('Selecione uma foto de até 500 KB.');
 try{
  const buffer=Buffer.from(input,'base64');
  const image=sharp(buffer,{limitInputPixels:16000000});
  const {format}=await image.metadata();
  if(!['png','jpeg','webp'].includes(format))throw Error();
  const photo=await image.rotate().resize({width:size,height:size,fit:'inside',withoutEnlargement:true}).jpeg({quality:70}).toBuffer();
  return 'data:image/jpeg;base64,'+photo.toString('base64');
 }catch{throw new AppError('Selecione uma foto JPEG, PNG ou WebP válida.')}
}
module.exports={preparePhoto};
