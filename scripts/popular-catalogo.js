// Cadastro opcional e idempotente para bancos de dados locais já existentes.
// Os produtos têm modelos reais; preços, estoque e artes são ilustrativos.
const {get,run,db}=require('../util/db');
const dados=require('../dados/catalogo-demonstracao.json');
(async()=>{
 await new Promise((resolve,reject)=>db.get('SELECT name FROM sqlite_master WHERE type=? AND name=?',['table','produtos'],(e)=>e?reject(e):resolve()));
 let novos=0;
 for(const c of dados.categorias){if(!await get('SELECT id FROM categorias WHERE nome=? COLLATE NOCASE',[c.nome]))await run('INSERT INTO categorias(nome,descricao) VALUES(?,?)',[c.nome,c.descricao]);}
 for(const marca of dados.marcas){if(!await get('SELECT id FROM marcas WHERE nome=? COLLATE NOCASE',[marca]))await run('INSERT INTO marcas(nome) VALUES(?)',[marca]);}
 for(const p of dados.produtos){
  if(await get('SELECT id FROM produtos WHERE nome=? COLLATE NOCASE',[p.nome]))continue;
  const r=await run('INSERT INTO produtos(nome,modelo,marca,categoria,valor,estoque,nivel,cor,descricao,imagem) VALUES(?,?,?,?,?,?,?,?,?,?)',[p.nome,p.modelo,p.marca,p.categoria,p.valor,p.estoque,p.nivel,p.cor,p.descricao,p.imagem]);
  for(let i=0;i<p.imagens.length;i++)await run('INSERT INTO produto_imagens(produto_id,arquivo,ordem) VALUES(?,?,?)',[r.lastID,p.imagens[i],i]);
  for(const [key,value] of Object.entries(p.especificacoes))await run('INSERT INTO produto_especificacoes(produto_id,chave,valor) VALUES(?,?,?)',[r.lastID,key,value]);
  novos++;
 }
 console.log(`Catálogo de demonstração: ${novos} produto(s) criado(s). Marcas e categorias verificadas.`);
})().catch(e=>{console.error('Erro ao popular catálogo:',e);process.exitCode=1}).finally(()=>db.close());
