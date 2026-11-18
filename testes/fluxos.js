// Teste de ponta a ponta local sem bibliotecas extras, usando banco temporário.
// Execute depois de 'npm install': npm run testar
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'andre-test-'));
process.env.DB_PATH=path.join(temporary,'teste.db');
process.env.SESSION_SECRET='session-secret-teste-local';
const app=require('../app');
const db=require('../banco/database');
let server;let base;let adminCookie='';let userCookie='';let uploadedFiles=[];
async function send(url,method='GET',body=null,cookie=''){
 const headers={};if(cookie)headers.cookie=cookie;
 if(body instanceof URLSearchParams)headers['content-type']='application/x-www-form-urlencoded';
 const response=await fetch(base+url,{method,headers,body,redirect:'manual'});
 const setCookie=response.headers.get('set-cookie');
 return {status:response.status,location:response.headers.get('location'),cookie:setCookie?.split(';')[0]||cookie,html:await response.text()};
}
const form=o=>new URLSearchParams(o);
(async()=>{
 await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve)});
 base='http://127.0.0.1:'+server.address().port;
 let r=await send('/inicial');assert.equal(r.status,302);
 r=await send('/');assert.equal(r.status,200);assert.match(r.html,/Mestre André Store/);assert.match(r.html,/pianoWrapper/);assert.match(r.html,/href="\/login"/);assert.match(r.html,/href="\/cadastro"/);assert.match(r.html,/href="\/boas-vindas"/);
 r=await send('/boas-vindas');assert.equal(r.status,200);assert.match(r.html,/action="\/cadastro"/);
 r=await send('/login');assert.equal(r.status,200);assert.match(r.html,/name="proximo"/);
 r=await send('/login?proximo=%2Fcarrinho%2Fconfirmar');assert.equal(r.status,200);assert.match(r.html,/value="\/carrinho\/confirmar"/);
 r=await send('/cadastro');assert.equal(r.status,200);assert.match(r.html,/name="proximo"/);
 r=await send('/cadastro?proximo=%2Fcarrinho%2Fconfirmar');assert.equal(r.status,200);assert.match(r.html,/value="\/carrinho\/confirmar"/);
 r=await send('/carrinho/confirmacao');assert.equal(r.status,302);assert.match(r.location,/login/);
 r=await send('/admin/configurar');assert.equal(r.status,200);
 r=await send('/admin/configurar','POST',form({senha:'admin-segura-2026',confirmar:'admin-segura-2026'}));assert.equal(r.status,302);adminCookie=r.cookie;
 r=await send('/login','POST',form({tipo:'admin',email:'admin@mestreandrestore.local',senha:'admin-segura-2026'}));assert.equal(r.status,302);assert.equal(r.location,'/admin/index');
 const loginAdminCookie=r.cookie;
 r=await send('/admin/index','GET',null,loginAdminCookie);assert.equal(r.status,200);assert.match(r.html,/Visão geral da loja/);
 r=await send('/login','POST',form({tipo:'admin',email:'admin@mestreandrestore.local',senha:'errada'}));assert.equal(r.status,302);assert.match(r.location,/erro=/);
 r=await send('/admin/marcas/cadastrar','POST',form({nome:'Marca Teste'}),adminCookie);assert.equal(r.status,302);
 r=await send('/admin/marcas', 'GET',null,adminCookie);assert.match(r.html,/Marca Teste/);
 r=await send('/admin/index','GET',null,adminCookie);assert.equal(r.status,200);assert.match(r.html,/Visão geral da loja/);assert.match(r.html,/Marcas cadastradas/);assert.match(r.html,/href="\/admin\/categorias"/);
 r=await send('/admin/categorias/cadastrar','POST',form({nome:'Guitarras',descricao:'Cordas'}),adminCookie);assert.equal(r.status,302);
 const photo=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64');
 const upload=new FormData();for(const [k,v] of Object.entries({nome:'Guitarra de Teste',modelo:'TG-01',categoria:'Guitarras',marca:'Marca Teste',valor:'1200',estoque:'5',nivel:'Iniciante',descricao:'Guitarra de teste',cor:'Preta'}))upload.append(k,v);
 upload.append('spec_chave[]','Cordas');upload.append('spec_valor[]','6');
 upload.append('imagens',new Blob([photo],{type:'image/png'}),'foto1.png');upload.append('imagens',new Blob([photo],{type:'image/png'}),'foto2.png');
 r=await send('/admin/produtos/cadastrar','POST',upload,adminCookie);assert.equal(r.status,302);
 const {get,all}=require('../util/db');const p=await get('SELECT * FROM produtos WHERE nome=?',['Guitarra de Teste']);assert.ok(p?.id);
 uploadedFiles=(await all('SELECT * FROM produto_imagens WHERE produto_id=?',[p.id])).map(i=>i.arquivo);assert.equal(uploadedFiles.length,2);
 assert.equal((await all('SELECT * FROM produto_especificacoes WHERE produto_id=?',[p.id]))[0].valor,'6');
 r=await send('/produto/'+p.id);assert.equal(r.status,200);assert.match(r.html,/Cordas/);assert.match(r.html,/6/);assert.match(r.html,/foto 2/i);
 r=await send('/cadastro','POST',form({nome:'Cliente Teste',email:'cliente@example.com',senha:'cliente-2026',confirmar:'cliente-2026',termos:'on'}));assert.equal(r.status,302);userCookie=r.cookie;
 r=await send('/minha-conta','GET',null,userCookie);assert.equal(r.status,200);assert.match(r.html,/Meus pedidos/);
 r=await send('/minha-conta/editar','POST',form({nome:'Cliente Atualizado',email:'cliente.novo@example.com'}),userCookie);assert.equal(r.status,302);
 r=await send('/minha-conta','GET',null,userCookie);assert.match(r.html,/Cliente Atualizado/);
 r=await send('/favoritos/'+p.id,'POST',form({}),userCookie);assert.equal(r.status,302);
 r=await send('/favoritos','GET',null,userCookie);assert.match(r.html,/Guitarra de Teste/);
 r=await send('/carrinho/adicionar/'+p.id,'POST',form({quantidade:'2'}),userCookie);assert.equal(r.status,302);
 r=await send('/carrinho','GET',null,userCookie);assert.match(r.html,/Guitarra de Teste/);assert.match(r.html,/2.400,00/);
 r=await send('/carrinho/confirmar','GET',null,userCookie);assert.equal(r.status,200);assert.match(r.html,/Guitarra de Teste/);assert.match(r.html,/2.400,00/);assert.match(r.html,/cliente.novo@example.com/);assert.match(r.html,/Entrega e revisão do pedido/);
 r=await send('/carrinho/finalizar','POST',form({contato:'(49) 99999-9999',entrega:'retirada',endereco:''}),userCookie);assert.equal(r.status,302);assert.match(r.location,/^\/carrinho\/pedido\/\d+$/);
 r=await send(r.location,'GET',null,userCookie);assert.equal(r.status,200);assert.match(r.html,/Guitarra de Teste/);assert.match(r.html,/2.400,00/);assert.match(r.html,/Pedido/);
 r=await send('/carrinho/confirmacao','GET',null,userCookie);assert.equal(r.status,302);assert.match(r.location,/carrinho\/pedido/);
 r=await send('/minha-conta','GET',null,userCookie);assert.match(r.html,/Pedido #/);
 assert.equal((await get('SELECT estoque FROM produtos WHERE id=?',[p.id])).estoque,3);
 console.log('OK: inicial, login, cadastro, entrada com e-mail, piano, admin, marca, categoria, fotos, ficha técnica, favoritos, sacola, entrega com produtos e valores, confirmação, pedido e estoque.');
})().catch(e=>{console.error('FALHOU:',e);process.exitCode=1}).finally(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await new Promise(resolve=>db.close(resolve));
 uploadedFiles.forEach(name=>{try{fs.unlinkSync(path.join(__dirname,'..','public','uploads',name))}catch(e){}});
 fs.rmSync(temporary,{recursive:true,force:true});
});
