// Compatibilidade com os endereços ensinados no projeto original.
// Os formulários novos usam as mesmas sessões e o mesmo banco SQLite.
const router=require('express').Router();
router.get('/login',(req,res)=>res.redirect('/login'));
router.get('/cadastro',(req,res)=>res.redirect('/cadastro'));
router.post('/login',(req,res)=>res.redirect(307,'/login'));
router.post('/cadastro',(req,res)=>res.redirect(307,'/cadastro'));
router.get('/logout',(req,res)=>res.redirect('/sair'));
router.get('/compra/confirmacao',(req,res)=>res.redirect('/carrinho/confirmacao'));
router.post('/compra/finalizar',(req,res)=>res.redirect(307,'/carrinho/finalizar'));
module.exports=router;
