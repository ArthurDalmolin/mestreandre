const express=require('express');
const router=express.Router();
const {all,get,run}=require('../util/db');
router.get('/:id',async(req,res,next)=>{try{
 const produto=await get('SELECT * FROM produtos WHERE id=?',[req.params.id]);
 if(!produto)return res.status(404).render('usuario/novas/erro',{titulo:'Instrumento não encontrado',mensagem:'Este produto não está disponível. Veja outras opções no catálogo.'});
 let imagens=await all('SELECT * FROM produto_imagens WHERE produto_id=? ORDER BY ordem,id',[produto.id]);
 if(!imagens.length&&produto.imagem)imagens=[{id:0,arquivo:produto.imagem}];
 const especificacoes=await all('SELECT * FROM produto_especificacoes WHERE produto_id=? ORDER BY id',[produto.id]);
 const avaliacoes=await all('SELECT a.*,u.nome FROM avaliacoes a JOIN usuarios u ON u.id=a.usuario_id WHERE a.produto_id=? ORDER BY a.criado_em DESC',[produto.id]);
 const favorito=req.session.usuario?await get('SELECT 1 FROM favoritos WHERE usuario_id=? AND produto_id=?',[req.session.usuario.id,produto.id]):null;
 res.render('usuario/produto/index',{produto,imagens,especificacoes,avaliacoes,favorito,freteMensagem:req.query.frete||'',avaliacaoMensagem:req.query.avaliacao||''});
}catch(e){next(e);}});
router.post('/:id/avaliar',async(req,res,next)=>{try{
 if(!req.session.usuario)return res.redirect('/login');
 const produto=await get('SELECT id FROM produtos WHERE id=?',[req.params.id]);if(!produto)return res.redirect('/catalogo');
 const nota=Number(req.body.nota),comentario=(req.body.comentario||'').trim();
 if(!Number.isInteger(nota)||nota<1||nota>5||comentario.length<5||comentario.length>1500)return res.redirect('/produto/'+produto.id+'?avaliacao='+encodeURIComponent('Escreva uma avaliação de 5 a 1500 caracteres e escolha de 1 a 5 estrelas.'));
 await run('INSERT INTO avaliacoes(produto_id,usuario_id,nota,comentario) VALUES(?,?,?,?) ON CONFLICT(produto_id,usuario_id) DO UPDATE SET nota=excluded.nota,comentario=excluded.comentario,criado_em=CURRENT_TIMESTAMP',[produto.id,req.session.usuario.id,nota,comentario]);
 res.redirect('/produto/'+produto.id+'#avaliacoes');
}catch(e){next(e);}});
router.post('/:id/consultar-frete',async(req,res,next)=>{try{
 const produto=await get('SELECT id FROM produtos WHERE id=?',[req.params.id]);if(!produto)return res.redirect('/catalogo');
 const cep=String(req.body.cep||'').replace(/\D/g,'');
 const contato=(req.body.contato||'').trim().slice(0,140);
 if(!/^\d{8}$/.test(cep)||!contato)return res.redirect('/produto/'+produto.id+'?frete='+encodeURIComponent('Digite um CEP válido com 8 números.'));
 await run('INSERT INTO frete_consultas(produto_id,usuario_id,cep,contato) VALUES(?,?,?,?)',[produto.id,req.session.usuario?.id||null,cep,contato]);
 res.redirect('/produto/'+produto.id+'?frete='+encodeURIComponent('Consulta de CEP registrada para atendimento. Valor e prazo dependem de confirmação da loja.'));
}catch(e){next(e);}});
module.exports=router;
