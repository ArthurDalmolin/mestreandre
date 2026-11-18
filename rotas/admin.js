const express=require('express');
const bcrypt=require('bcryptjs');
const {all,get,run}=require('../util/db');
const upload=require('../util/imagens');
const router=express.Router();
const isLocal=req=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.ip);
const failure=(res,msg,code=400)=>res.status(code).render('admin/aviso',{mensagem:msg});

router.get('/',async(req,res,next)=>{try{
 if(req.session.admin)return res.redirect('/admin/index');
 const conta=await get('SELECT 1 FROM admin_config WHERE id=1');
 res.render('admin/login',{configurado:!!conta,erro:''});
}catch(e){next(e);}});
router.get('/configurar',async(req,res,next)=>{try{
 if(!isLocal(req))return failure(res,'A configuração inicial só está disponível no computador local.',403);
 if(await get('SELECT 1 FROM admin_config WHERE id=1'))return res.redirect('/admin');
 res.render('admin/configurar',{erro:''});
}catch(e){next(e);}});
router.post('/configurar',async(req,res,next)=>{try{
 if(!isLocal(req))return failure(res,'A configuração inicial só é permitida localmente.',403);
 if(await get('SELECT 1 FROM admin_config WHERE id=1'))return res.redirect('/admin');
 const {senha,confirmar}=req.body;
 if(!senha||senha.length<8||senha!==confirmar)return res.render('admin/configurar',{erro:'Digite uma senha de no mínimo 8 caracteres, igual nos dois campos.'});
 await run('INSERT INTO admin_config(id,senha_hash,email) VALUES(1,?,?)',[bcrypt.hashSync(senha,10),(req.body.email||'admin@mestreandrestore.local').trim().toLowerCase()]);
 req.session.admin=true;res.redirect('/admin/index');
}catch(e){next(e);}});
router.post('/login',async(req,res,next)=>{try{
 const config=await get('SELECT senha_hash FROM admin_config WHERE id=1');
 if(!config)return res.redirect('/admin/configurar');
 if(!bcrypt.compareSync(req.body.senha||'',config.senha_hash))return res.status(401).render('admin/login',{configurado:true,erro:'Senha incorreta.'});
 req.session.admin=true;res.redirect('/admin/index');
}catch(e){next(e);}});
router.post('/sair',(req,res)=>{req.session.destroy(()=>res.redirect('/login'));});
router.use((req,res,next)=>req.session.admin?next():res.redirect('/admin'));
router.use((req,res,next)=>{res.locals.adminPath=req.originalUrl.split('?')[0];next();});
router.get('/configuracoes',async(req,res,next)=>{try{
 const config=await get('SELECT email FROM admin_config WHERE id=1');
 res.render('admin/configuracoes',{email:config&&config.email||'admin@mestreandrestore.local',erro:'',sucesso:''});
}catch(e){next(e);}});
router.post('/configuracoes',async(req,res,next)=>{try{
 const email=(req.body.email||'').trim().toLowerCase();
 const config=await get('SELECT * FROM admin_config WHERE id=1');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!bcrypt.compareSync(req.body.senha||'',config.senha_hash))
   return res.render('admin/configuracoes',{email,erro:'Confira o e-mail e a senha atual do administrador.',sucesso:''});
 await run('UPDATE admin_config SET email=? WHERE id=1',[email]);
 res.render('admin/configuracoes',{email,erro:'',sucesso:'E-mail administrativo atualizado.'});
}catch(e){next(e);}});

router.get('/index',async(req,res,next)=>{try{
 const [produtos,categorias,marcas,pedidos,fretes,estoqueBaixo,ultimosProdutos,ultimosPedidos,distribuicao]=await Promise.all([
 get('SELECT COUNT(*) n FROM produtos'),get('SELECT COUNT(*) n FROM categorias'),get('SELECT COUNT(*) n FROM marcas'),get('SELECT COUNT(*) n FROM pedidos'),get('SELECT COUNT(*) n FROM frete_consultas'),
 get('SELECT COUNT(*) n FROM produtos WHERE estoque<=3'),
 all('SELECT id,nome,marca,categoria,valor,estoque,imagem FROM produtos ORDER BY id DESC LIMIT 5'),
 all('SELECT p.id,p.valor_total,p.status,p.criado_em,u.nome FROM pedidos p LEFT JOIN usuarios u ON u.id=p.usuario_id ORDER BY p.id DESC LIMIT 5'),
 all("SELECT COALESCE(NULLIF(TRIM(categoria),''),'Sem categoria') AS nome,COUNT(*) AS quantidade FROM produtos GROUP BY COALESCE(NULLIF(TRIM(categoria),''),'Sem categoria') ORDER BY quantidade DESC,nome LIMIT 6")]);
 const contagens={produtos:produtos.n,categorias:categorias.n,marcas:marcas.n,pedidos:pedidos.n,fretes:fretes.n,estoqueBaixo:estoqueBaixo.n};
 res.render('admin/index-admin',{contagens,ultimosProdutos,ultimosPedidos,distribuicao});
}catch(e){next(e);}});
router.get('/categorias',async(req,res,next)=>{try{res.render('admin/categorias/lista',{categorias:await all('SELECT * FROM categorias ORDER BY nome')});}catch(e){next(e);}});
router.get('/categorias/form-cadastrar',(req,res)=>res.render('admin/categorias/cadastro'));
router.post('/categorias/cadastrar',async(req,res,next)=>{try{
 const nome=(req.body.nome||'').trim();if(!nome)return failure(res,'Informe o nome da categoria.');
 await run('INSERT INTO categorias(nome,descricao) VALUES(?,?)',[nome,(req.body.descricao||'').trim()]);res.redirect('/admin/categorias');
}catch(e){next(e);}});
router.post('/categorias/excluir/:id',async(req,res,next)=>{try{
 const row=await get('SELECT nome FROM categorias WHERE id=?',[req.params.id]);
 if(row&&await get('SELECT 1 FROM produtos WHERE categoria=? LIMIT 1',[row.nome]))return failure(res,'Existem produtos nesta categoria. Edite os produtos antes de removê-la.');
 await run('DELETE FROM categorias WHERE id=?',[req.params.id]);res.redirect('/admin/categorias');
}catch(e){next(e);}});
router.get('/marcas',async(req,res,next)=>{try{res.render('admin/marcas/lista',{marcas:await all('SELECT * FROM marcas ORDER BY nome')});}catch(e){next(e);}});
router.get('/marcas/cadastrar',(req,res)=>res.render('admin/marcas/cadastro',{marca:null}));
router.get('/marcas/form-cadastrar',(req,res)=>res.redirect('/admin/marcas/cadastrar'));
router.post('/marcas/cadastrar',upload.single('imagem'),async(req,res,next)=>{try{
 const nome=(req.body.nome||'').trim();if(!nome)return failure(res,'Informe a marca.');
 await run('INSERT INTO marcas(nome,imagem) VALUES(?,?)',[nome,req.file?req.file.filename:null]);res.redirect('/admin/marcas');
}catch(e){next(e);}});
router.get('/marcas/editar/:id',async(req,res,next)=>{try{
 const marca=await get('SELECT * FROM marcas WHERE id=?',[req.params.id]);if(!marca)return failure(res,'Marca inexistente.',404);
 res.render('admin/marcas/cadastro',{marca});
}catch(e){next(e);}});
router.post('/marcas/editar/:id',upload.single('imagem'),async(req,res,next)=>{try{
 const marca=await get('SELECT * FROM marcas WHERE id=?',[req.params.id]);if(!marca)return failure(res,'Marca inexistente.',404);
 const nome=(req.body.nome||'').trim();if(!nome)return failure(res,'Informe a marca.');
 await run('UPDATE marcas SET nome=?,imagem=? WHERE id=?',[nome,req.file?req.file.filename:marca.imagem,marca.id]);
 await run('UPDATE produtos SET marca=? WHERE marca=?',[nome,marca.nome]);res.redirect('/admin/marcas');
}catch(e){next(e);}});
router.post('/marcas/excluir/:id',async(req,res,next)=>{try{
 const marca=await get('SELECT nome FROM marcas WHERE id=?',[req.params.id]);
 if(marca&&await get('SELECT 1 FROM produtos WHERE marca=? LIMIT 1',[marca.nome]))return failure(res,'Esta marca está sendo usada por produtos. Altere-os antes de excluir.');
 await run('DELETE FROM marcas WHERE id=?',[req.params.id]);res.redirect('/admin/marcas');
}catch(e){next(e);}});
async function dependencies(){return {categorias:await all('SELECT * FROM categorias ORDER BY nome'),marcas:await all('SELECT * FROM marcas ORDER BY nome')};}
async function productGallery(id){return await all('SELECT * FROM produto_imagens WHERE produto_id=? ORDER BY ordem,id',[id]);}
async function specifications(id){return await all('SELECT * FROM produto_especificacoes WHERE produto_id=? ORDER BY id',[id]);}
router.get('/produtos',async(req,res,next)=>{try{res.render('admin/produtos/lista',{produtos:await all('SELECT * FROM produtos ORDER BY id DESC')});}catch(e){next(e);}});
router.get('/produtos/form-cadastrar',async(req,res,next)=>{try{res.render('admin/produtos/cadastro',{...await dependencies(),produto:null,imagens:[],especificacoes:[]});}catch(e){next(e);}});
router.get('/produtos/editar/:id',async(req,res,next)=>{try{
 const produto=await get('SELECT * FROM produtos WHERE id=?',[req.params.id]);if(!produto)return failure(res,'Produto inexistente.',404);
 res.render('admin/produtos/cadastro',{...await dependencies(),produto,imagens:await productGallery(produto.id),especificacoes:await specifications(produto.id)});
}catch(e){next(e);}});
const parseSpecs=(body)=>{
 const keys=[].concat(body.spec_chave||body['spec_chave[]']||[]), values=[].concat(body.spec_valor||body['spec_valor[]']||[]);
 return keys.map((chave,i)=>({chave:String(chave||'').trim().slice(0,90),valor:String(values[i]||'').trim().slice(0,700)})).filter(s=>s.chave&&s.valor).slice(0,35);
};
async function saveSpecs(id,body){
 await run('DELETE FROM produto_especificacoes WHERE produto_id=?',[id]);
 for(const {chave,valor} of parseSpecs(body))await run('INSERT INTO produto_especificacoes(produto_id,chave,valor) VALUES(?,?,?)',[id,chave,valor]);
}
const asProduct=body=>{
 const nome=(body.nome||'').trim().slice(0,180);
 const valor=Number(body.valor),estoque=Number(body.estoque);
 if(!nome||!Number.isFinite(valor)||valor<0||!Number.isInteger(estoque)||estoque<0)throw Error('Nome, preço e estoque devem ser válidos.');
 return [nome,(body.descricao||'').trim().slice(0,6000),(body.marca||'').trim(),valor,estoque,(body.nivel||'').trim(),(body.categoria||'').trim(),(body.modelo||'').trim(),(body.cor||'').trim()];
};
router.post('/produtos/cadastrar',upload.array('imagens',8),async(req,res,next)=>{try{
 const dados=asProduct(req.body);const files=req.files||[];
 if(!files.length)return failure(res,'Selecione pelo menos uma imagem para o produto.');
 const result=await run('INSERT INTO produtos(nome,descricao,marca,valor,estoque,nivel,categoria,modelo,cor,imagem) VALUES(?,?,?,?,?,?,?,?,?,?)',[...dados,files[0].filename]);
 for(let i=0;i<files.length;i++)await run('INSERT INTO produto_imagens(produto_id,arquivo,ordem) VALUES(?,?,?)',[result.lastID,files[i].filename,i]);
 await saveSpecs(result.lastID,req.body);res.redirect('/admin/produtos');
}catch(e){next(e);}});
router.post('/produtos/editar/:id',upload.array('imagens',8),async(req,res,next)=>{try{
 const produto=await get('SELECT * FROM produtos WHERE id=?',[req.params.id]);if(!produto)return failure(res,'Produto não encontrado.',404);
 const dados=asProduct(req.body),files=req.files||[];
 await run('UPDATE produtos SET nome=?,descricao=?,marca=?,valor=?,estoque=?,nivel=?,categoria=?,modelo=?,cor=? WHERE id=?',[...dados,produto.id]);
 const existentes=await productGallery(produto.id);
 if(!existentes.length&&produto.imagem)await run('INSERT INTO produto_imagens(produto_id,arquivo,ordem) VALUES(?,?,?)',[produto.id,produto.imagem,0]);
 for(const imagem of files)await run('INSERT INTO produto_imagens(produto_id,arquivo,ordem) VALUES(?,?,(SELECT COUNT(*) FROM produto_imagens WHERE produto_id=?))',[produto.id,imagem.filename,produto.id]);
 await saveSpecs(produto.id,req.body);
 const fotos=await productGallery(produto.id);
 const capaId=Number(req.body.capa_id);
 const capa= fotos.find(f=>f.id===capaId)||fotos[0];
 await run('UPDATE produtos SET imagem=? WHERE id=?',[capa?capa.arquivo:produto.imagem,produto.id]);
 res.redirect('/admin/produtos/editar/'+produto.id);
}catch(e){next(e);}});
router.post('/produtos/imagem/excluir/:id',async(req,res,next)=>{try{
 const foto=await get('SELECT * FROM produto_imagens WHERE id=?',[req.params.id]);if(!foto)return failure(res,'Imagem não encontrada.',404);
 const fotos=await productGallery(foto.produto_id);if(fotos.length<=1)return failure(res,'Mantenha pelo menos uma foto por produto.');
 await run('DELETE FROM produto_imagens WHERE id=?',[foto.id]);
 const produto=await get('SELECT imagem FROM produtos WHERE id=?',[foto.produto_id]);
 if(produto.imagem===foto.arquivo){const primeira=await get('SELECT arquivo FROM produto_imagens WHERE produto_id=? ORDER BY ordem,id LIMIT 1',[foto.produto_id]);await run('UPDATE produtos SET imagem=? WHERE id=?',[primeira.arquivo,foto.produto_id]);}
 res.redirect('/admin/produtos/editar/'+foto.produto_id);
}catch(e){next(e);}});
router.post('/produtos/excluir/:id',async(req,res,next)=>{try{
 await run('DELETE FROM favoritos WHERE produto_id=?',[req.params.id]);await run('DELETE FROM produtos WHERE id=?',[req.params.id]);res.redirect('/admin/produtos');
}catch(e){next(e);}});
router.get('/pedidos',async(req,res,next)=>{try{res.render('admin/pedidos',{pedidos:await all('SELECT p.*,u.nome,u.email FROM pedidos p JOIN usuarios u ON u.id=p.usuario_id ORDER BY p.id DESC')});}catch(e){next(e);}});
router.post('/pedidos/:id/status',async(req,res,next)=>{let inTransaction=false;try{
 const status=req.body.status;
 if(!['aguardando atendimento','em preparação','concluído','cancelado'].includes(status))return failure(res,'Status inválido.');
 const pedido=await get('SELECT * FROM pedidos WHERE id=?',[req.params.id]);if(!pedido)return failure(res,'Pedido não encontrado.',404);
 if(pedido.status==='cancelado'&&status!=='cancelado')return failure(res,'Um pedido cancelado não pode ser reaberto automaticamente. Peça um novo pedido para garantir o estoque.');
 await run('BEGIN IMMEDIATE TRANSACTION');inTransaction=true;
 if(status==='cancelado'&&pedido.status!=='cancelado'){
  for(const item of await all('SELECT produto_id,quantidade FROM pedido_itens WHERE pedido_id=?',[pedido.id]))await run('UPDATE produtos SET estoque=estoque+? WHERE id=?',[item.quantidade,item.produto_id]);
 }
 await run('UPDATE pedidos SET status=? WHERE id=?',[status,pedido.id]);
 await run('COMMIT');inTransaction=false;res.redirect('/admin/pedidos');
}catch(e){if(inTransaction)await run('ROLLBACK').catch(()=>{});next(e);}});
router.get('/fretes',async(req,res,next)=>{try{res.render('admin/fretes',{fretes:await all('SELECT f.*,p.nome AS produto,u.email FROM frete_consultas f JOIN produtos p ON p.id=f.produto_id LEFT JOIN usuarios u ON u.id=f.usuario_id ORDER BY f.id DESC')});}catch(e){next(e);}});
module.exports=router;
