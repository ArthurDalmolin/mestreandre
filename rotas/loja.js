const express=require('express');
const crypto=require('crypto');
const bcrypt=require('bcryptjs');
const router=express.Router();
const {all,get,run}=require('../util/db');
const hash=(pass,salt)=>crypto.scryptSync(pass,salt,64).toString('hex');
const safe=req=>req.session.usuario;
const page=(res,name,opts={})=>res.render('usuario/novas/'+name,opts);
const nextPath=req=>((req.body && req.body.proximo)==='/carrinho/confirmar'||(req.query && req.query.proximo)==='/carrinho/confirmar')?'/carrinho/confirmar':'/inicial';
router.get('/boas-vindas',(req,res)=>page(res,'boas-vindas'));
router.get('/login',(req,res)=>page(res,'login',{erro:req.query.erro||'',proximo:nextPath(req)}));
router.get('/cadastro',(req,res)=>page(res,'cadastro',{erro:req.query.erro||'',email:req.query.email||'',proximo:nextPath(req)}));
router.get('/recuperar-senha',(req,res)=>page(res,'recuperar',{mensagem:'',link:''}));
router.get('/sair',(req,res)=>req.session.destroy(()=>res.redirect('/inicial')));
router.post('/cadastro',async(req,res,next)=>{try{
 const nome=(req.body.nome||'').trim(),email=(req.body.email||'').trim().toLowerCase(),senha=req.body.senha||'';
 if(!nome||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||senha.length<8||senha!==req.body.confirmar||req.body.termos!=='on')return res.redirect('/cadastro?erro='+encodeURIComponent('Preencha os dados, aceite os termos e use duas senhas iguais de 8 caracteres ou mais.')+'&email='+encodeURIComponent(email)+'&proximo='+encodeURIComponent(nextPath(req)));
 const salt=crypto.randomBytes(16).toString('hex');
 // Banco legado da disciplina possui CPF e senha obrigatórios. Geramos identificador interno
 // para o cadastro novo e guardamos somente hashes, sem destruir registros antigos.
 const cpfInterno='site-'+crypto.randomBytes(12).toString('hex');
 const result=await run('INSERT INTO usuarios(nome,email,cpf,senha,senha_hash) VALUES(?,?,?,?,?)',[nome,email,cpfInterno,bcrypt.hashSync(senha,10),salt+':'+hash(senha,salt)]);
 req.session.usuario={id:result.lastID,nome};res.redirect(nextPath(req));
}catch(e){return res.redirect('/cadastro?erro='+encodeURIComponent(e.code==='SQLITE_CONSTRAINT'?'Este e-mail já está cadastrado.':'Não foi possível cadastrar. Confira os dados.')+'&email='+encodeURIComponent(String(req.body.email||'').trim())+'&proximo='+encodeURIComponent(nextPath(req)));}});
router.post('/login',async(req,res)=>{try{
 if(req.body.tipo==='admin'){
  const admin=await get('SELECT senha_hash,email FROM admin_config WHERE id=1');
  const emailAdmin=(admin&&admin.email||'admin@mestreandrestore.local').toLowerCase();
  if(!admin || String(req.body.email||'').trim().toLowerCase()!==emailAdmin || !bcrypt.compareSync(req.body.senha||'',admin.senha_hash))
   return res.redirect('/login?erro='+encodeURIComponent('E-mail ou senha administrativa inválidos.'));
  const currentCart=req.session.carrinho||[];
  const descontos={musicaLiberada:req.session.musicaLiberada,cupomDesconto:req.session.cupomDesconto,cupomFrete:req.session.cupomFrete};
  return req.session.regenerate(err=>{if(err)return res.status(500).send('Erro na sessão');req.session.admin=true;req.session.carrinho=currentCart;Object.assign(req.session,descontos);res.redirect('/admin/index');});
 }
 const email=(req.body.email||'').trim().toLowerCase(),u=await get('SELECT * FROM usuarios WHERE email=?',[email]);
 let valid=false;
 if(u&&u.senha_hash&&u.senha_hash.includes(':')){const [salt,stored]=u.senha_hash.split(':');const actual=hash(req.body.senha||'',salt);valid=stored.length===actual.length&&crypto.timingSafeEqual(Buffer.from(stored,'hex'),Buffer.from(actual,'hex'));}
 if(!valid&&u&&u.senha&&u.senha.startsWith('$2'))valid=bcrypt.compareSync(req.body.senha||'',u.senha);
 if(!valid)return res.redirect('/login?erro='+encodeURIComponent('E-mail ou senha inválidos.')+'&proximo='+encodeURIComponent(nextPath(req)));
 const currentCart=req.session.carrinho||[],destino=nextPath(req);
 const descontos={musicaLiberada:req.session.musicaLiberada,cupomDesconto:req.session.cupomDesconto,cupomFrete:req.session.cupomFrete};
 req.session.regenerate(err=>{if(err)return res.status(500).send('Erro na sessão');req.session.usuario={id:u.id,nome:u.nome};req.session.carrinho=currentCart;Object.assign(req.session,descontos);res.redirect(destino);});
}catch(e){res.redirect('/login?erro='+encodeURIComponent('Não foi possível entrar.'));}});
router.post('/recuperar-senha',async(req,res,next)=>{try{
 const email=(req.body.email||'').trim().toLowerCase(),u=await get('SELECT id FROM usuarios WHERE email=?',[email]);let link='';
 if(u){const token=crypto.randomBytes(32).toString('hex');await run('INSERT INTO recuperacoes(usuario_id,token_hash,expira) VALUES(?,?,?)',[u.id,crypto.createHash('sha256').update(token).digest('hex'),Date.now()+1800000]);link='/redefinir-senha?token='+token;}
 page(res,'recuperar',{mensagem:'Se o e-mail existir, a recuperação foi iniciada. Este projeto não envia e-mails; quando disponível, use o link de teste local abaixo.',link});
}catch(e){next(e);}});
router.get('/redefinir-senha',(req,res)=>page(res,'redefinir',{token:req.query.token||'',erro:''}));
router.post('/redefinir-senha',async(req,res,next)=>{try{
 const token=req.body.token||'',render=erro=>page(res,'redefinir',{token,erro});
 if(!/^[a-f0-9]{64}$/.test(token)||!req.body.senha||req.body.senha.length<8||req.body.senha!==req.body.confirmar)return render('Confira o link e as senhas (mínimo 8 caracteres).');
 const key=crypto.createHash('sha256').update(token).digest('hex'),record=await get('SELECT * FROM recuperacoes WHERE token_hash=? AND expira>?',[key,Date.now()]);
 if(!record)return render('Link inválido ou expirado. Solicite outro.');const salt=crypto.randomBytes(16).toString('hex');
 await run('UPDATE usuarios SET senha_hash=?,senha=? WHERE id=?',[salt+':'+hash(req.body.senha,salt),bcrypt.hashSync(req.body.senha,10),record.usuario_id]);
 await run('DELETE FROM recuperacoes WHERE usuario_id=?',[record.usuario_id]);res.redirect('/login?erro='+encodeURIComponent('Senha atualizada. Entre com a nova senha.'));
}catch(e){next(e);}});
router.get('/minha-conta',async(req,res,next)=>{try{
 if(!safe(req))return res.redirect('/login');
 const usuario=await get('SELECT id,nome,email FROM usuarios WHERE id=?',[safe(req).id]);
 if(!usuario)return res.redirect('/login');
 const pedidos=await all('SELECT * FROM pedidos WHERE usuario_id=? ORDER BY id DESC',[safe(req).id]);
 for(const pedido of pedidos){pedido.itens=await all('SELECT pi.*,p.imagem,p.categoria FROM pedido_itens pi LEFT JOIN produtos p ON p.id=pi.produto_id WHERE pi.pedido_id=?',[pedido.id]);}
 page(res,'conta',{usuario,pedidos,erro:req.query.erro||'',sucesso:req.query.sucesso||''});
}catch(e){next(e);}});
router.post('/minha-conta/editar',async(req,res,next)=>{try{
 if(!safe(req))return res.redirect('/login');
 const nome=String(req.body.nome||'').trim().slice(0,100),email=String(req.body.email||'').trim().toLowerCase().slice(0,150);
 if(nome.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.redirect('/minha-conta?erro='+encodeURIComponent('Informe um nome e e-mail válidos.'));
 const existe=await get('SELECT id FROM usuarios WHERE email=? AND id<>?',[email,safe(req).id]);
 if(existe)return res.redirect('/minha-conta?erro='+encodeURIComponent('Esse e-mail já pertence a outra conta.'));
 await run('UPDATE usuarios SET nome=?,email=? WHERE id=?',[nome,email,safe(req).id]);
 req.session.usuario.nome=nome;
 res.redirect('/minha-conta?sucesso='+encodeURIComponent('Perfil atualizado com sucesso.'));
}catch(e){next(e);}});
router.get('/informacoes/:assunto',(req,res)=>{
 const assuntos={entrega:'Entrega e frete',trocas:'Trocas e devoluções',garantia:'Garantia',privacidade:'Privacidade',termos:'Termos de uso',atendimento:'Atendimento',redes:'Redes sociais','login-social':'Login social'};
 const titulo=assuntos[req.params.assunto];if(!titulo)return res.status(404).render('usuario/novas/erro',{titulo:'Página não encontrada',mensagem:'Não encontramos esta informação.'});
 page(res,'informacoes',{titulo,assunto:req.params.assunto});
});
router.post('/newsletter',async(req,res)=>{
 const email=(req.body.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.redirect('/?newsletter=erro');
 try{await run('INSERT OR IGNORE INTO newsletter(email) VALUES(?)',[email]);res.redirect('/?newsletter=ok');}catch(e){res.redirect('/?newsletter=erro');}
});
router.get('/catalogo',async(req,res,next)=>{try{
 const produtos=await all('SELECT * FROM produtos ORDER BY id DESC'),marcas=await all('SELECT * FROM marcas ORDER BY nome');
 page(res,'catalogo',{produtos,marcas,usuario:safe(req),busca:req.query.busca||'',filtros:req.query});
}catch(e){next(e);}});
router.get('/favoritos',async(req,res,next)=>{try{
 if(!safe(req))return res.redirect('/login');
 const produtos=await all('SELECT p.* FROM favoritos f JOIN produtos p ON p.id=f.produto_id WHERE f.usuario_id=? ORDER BY p.id DESC',[safe(req).id]);
 page(res,'favoritos',{produtos,usuario:safe(req)});
}catch(e){next(e);}});
router.post('/favoritos/:id',async(req,res,next)=>{try{
 if(!safe(req))return res.redirect('/login');
 const id=Number(req.params.id);if(!Number.isInteger(id))return res.status(400).render('usuario/novas/erro',{titulo:'Produto inválido',mensagem:'Confira o endereço do produto.'});
 const found=await get('SELECT 1 FROM favoritos WHERE usuario_id=? AND produto_id=?',[safe(req).id,id]);
 if(found)await run('DELETE FROM favoritos WHERE usuario_id=? AND produto_id=?',[safe(req).id,id]);
 else if(await get('SELECT 1 FROM produtos WHERE id=?',[id]))await run('INSERT INTO favoritos(usuario_id,produto_id) VALUES(?,?)',[safe(req).id,id]);
 res.redirect('/favoritos');
}catch(e){next(e);}});
module.exports=router;
