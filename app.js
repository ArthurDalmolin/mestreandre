const express=require('express');
const session=require('express-session');
const path=require('path');
const {all}=require('./util/db');
const app=express();
const port=Number(process.env.PORT)||3000;
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.use(express.urlencoded({extended:true,limit:'1mb'}));
app.use(express.static(path.join(__dirname,'public')));
app.use(session({secret:process.env.SESSION_SECRET||'projeto-local-altere-o-segredo',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax'}}));
// Dados compartilhados pelos cabeçalhos de todas as páginas EJS.
app.use(async(req,res,next)=>{
 try{
  res.locals.categoriasMenu=await all('SELECT * FROM categorias ORDER BY nome');
  res.locals.produtosBusca=await all('SELECT id,nome,marca,imagem,valor,categoria FROM produtos ORDER BY id DESC LIMIT 80');
  res.locals.usuarioAtual=req.session.usuario||null;
  res.locals.adminAtual=Boolean(req.session.admin);
  res.locals.quantidadeSacola=(req.session.carrinho||[]).reduce((s,i)=>s+i.quantidade,0);
  res.locals.quantidadeFavoritos=req.session.usuario?(await all('SELECT produto_id FROM favoritos WHERE usuario_id=?',[req.session.usuario.id])).length:0;
  res.locals.formatarValor=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  res.locals.imagemUrl=arquivo=>/^https:\/\//.test(arquivo||'')?arquivo:'/uploads/'+(arquivo||'');
  res.locals.imagemReserva=categoria=>({'Pianos e Teclados':'/img/teclados.png','Guitarras':'/img/guitarras.png','Violões':'/img/guitarra_color.jpg','Contrabaixos':'/img/guitarras.png','Baterias e Percussão':'/img/bateria_color.jpg','Microfones':'/img/acessorios.png','Áudio e Interfaces':'/img/acessorios.png','Acessórios':'/img/palhetas_banner.png'}[categoria]||'/img/acessorios.png');
  next();
 }catch(e){next(e);}
});
app.get('/',async(req,res,next)=>{try{
 const [categorias,marcas,todosProdutos]=await Promise.all([all('SELECT * FROM categorias ORDER BY nome'),all('SELECT * FROM marcas ORDER BY nome'),all('SELECT * FROM produtos ORDER BY id DESC')]);
 const categoriasDestaque=['Pianos e Teclados','Guitarras','Violões','Contrabaixos','Baterias e Percussão','Microfones','Áudio e Interfaces','Acessórios'];
 const produtos=categoriasDestaque.map(cat=>todosProdutos.find(p=>p.categoria===cat)).filter(Boolean);
 for(const p of todosProdutos){if(produtos.length>=8)break;if(!produtos.some(item=>item.id===p.id))produtos.push(p);}
 res.render('usuario/inicial/index',{categorias,marcas,produtos,newsletterMsg:req.query.newsletter==='ok'?'E-mail cadastrado para receber novidades.':req.query.newsletter==='erro'?'Confira o e-mail informado.':''});
}catch(e){next(e);}});
app.get('/inicial',(req,res)=>res.redirect('/'+(req.originalUrl.includes('?')?'?'+req.originalUrl.split('?').slice(1).join('?'):'')));
app.get('/entrega',(req,res)=>res.redirect('/carrinho/confirmar'));
app.get('/confirmacao-pedido',(req,res)=>res.redirect('/carrinho/confirmacao'));
app.get('/inicio-email',(req,res)=>res.redirect('/boas-vindas'));
app.use('/admin',require('./rotas/admin'));
app.use('/produto',require('./rotas/produto'));
app.use('/carrinho',require('./rotas/rotas-carrinho'));
app.use('/',require('./rotas/loja'));
app.use('/acesso',require('./rotas/rotas-usuario'));
app.use((req,res)=>res.status(404).render('usuario/novas/erro',{titulo:'Página não encontrada',mensagem:'Este endereço não existe. Volte à loja para continuar.'}));
app.use((err,req,res,next)=>{console.error(err);res.status(err.code==='LIMIT_FILE_SIZE'?413:500).render('usuario/novas/erro',{titulo:'Não foi possível concluir',mensagem:err.message||'Erro interno. Tente novamente.'});});
if(require.main===module)app.listen(port,()=>console.log(`Servidor rodando em http://localhost:${port}`));
module.exports=app;
