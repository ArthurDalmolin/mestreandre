const multer=require('multer');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const pasta=path.join(__dirname,'..','public','uploads');
fs.mkdirSync(pasta,{recursive:true});
const upload=multer({storage:multer.diskStorage({destination:(req,file,cb)=>cb(null,pasta),filename:(req,file,cb)=>{
 const ext=({ 'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/gif':'.gif' })[file.mimetype]||'.bin';
 cb(null,`${Date.now()}-${crypto.randomBytes(7).toString('hex')}${ext}`);
}}),fileFilter:(req,file,cb)=>{
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.mimetype))return cb(new Error('Envie somente imagens JPG, PNG, WebP ou GIF.'));
 cb(null,true);
},limits:{fileSize:5*1024*1024,files:8}});
module.exports=upload;
