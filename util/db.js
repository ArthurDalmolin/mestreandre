const db=require('../banco/database');
const all=(sql,args=[])=>new Promise((resolve,reject)=>db.all(sql,args,(e,r)=>e?reject(e):resolve(r)));
const get=(sql,args=[])=>new Promise((resolve,reject)=>db.get(sql,args,(e,r)=>e?reject(e):resolve(r)));
const run=(sql,args=[])=>new Promise((resolve,reject)=>db.run(sql,args,function(e){e?reject(e):resolve(this)}));
module.exports={db,all,get,run};
