// Atualiza somente as imagens de demonstração SVG. Não mexe nas fotos enviadas pelo administrador.
const db=require('../banco/database');
const fotos=require('../dados/fotografias-produtos.json');
db.serialize(()=>{
 db.all('SELECT id,nome,imagem FROM produtos',[],(err,produtos)=>{
  if(err){console.error(err.message);process.exitCode=1;return;}
  let alterados=0;
  for(const produto of produtos){
   const foto=fotos[produto.nome];
   if(!foto||!produto.imagem||!/^demo-.*\.svg$/.test(produto.imagem))continue;
   db.run('UPDATE produtos SET imagem=? WHERE id=?',[foto,produto.id]);
   db.run("DELETE FROM produto_imagens WHERE produto_id=? AND arquivo LIKE 'demo-%.svg'",[produto.id]);
   db.run('INSERT INTO produto_imagens(produto_id,arquivo,ordem) VALUES(?,?,0)',[produto.id,foto]);
   alterados++;
  }
  db.run('SELECT 1',[],()=>{console.log('Fotografias substituídas:',alterados);db.close();});
 });
});
