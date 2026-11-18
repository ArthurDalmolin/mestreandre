const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const views=path.join(root,'views');
function htmlEscape(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function compile(tpl,filename){let output='let __out="";';let index=0;const re=/<%([=#-]?)([\s\S]*?)%>/g;let m;
 while((m=re.exec(tpl))){if(m.index>index)output+='__out+='+JSON.stringify(tpl.slice(index,m.index))+';\n';
 let inside=m[2];if(m[1]==='=')output+='__out+=__escape('+inside+');\n';else if(m[1]==='-')output+='__out+=String(('+inside+')??"");\n';else if(m[1]!=='#')output+=inside+'\n';
 index=re.lastIndex;
 }if(index<tpl.length)output+='__out+='+JSON.stringify(tpl.slice(index))+';\n';output+='return __out;';
 try{return new Function('__locals','__escape','__include','with(__locals){const include=__include;\n'+output+'\n}');}catch(e){e.message=filename+': '+e.message;throw e;}
}
const compiled=new Map();function render(filepath,data){const filename=path.resolve(filepath);let f=compiled.get(filename);if(!f){f=compile(fs.readFileSync(filename,'utf8'),filename);compiled.set(filename,f);}let include=(name)=>{const next=path.resolve(path.dirname(filename),name.endsWith('.ejs')?name:name+'.ejs');return render(next,data);};return f(data,htmlEscape,include);}
const files=[];function walk(d){for(const entry of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,entry.name);if(entry.isDirectory())walk(p);else if(p.endsWith('.ejs'))files.push(p);}}walk(views);
for(let file of files)compile(fs.readFileSync(file,'utf8'),file);console.log('Templates EJS compilados:',files.length);
const data={adminPath:'/admin/index',contagens:{produtos:21,marcas:12,categorias:9,pedidos:2,fretes:0,estoqueBaixo:4},ultimosProdutos:[{id:1,nome:'Piano digital Yamaha P-145',marca:'Yamaha',categoria:'Pianos e Teclados',valor:3890,estoque:8,imagem:'demo.svg'},{id:2,nome:'Guitarra elétrica Fender Stratocaster',marca:'Fender',categoria:'Guitarras',valor:4490,estoque:2,imagem:'demo.svg'}],ultimosPedidos:[{id:3,nome:'Cliente teste',status:'aguardando atendimento',valor_total:3890,criado_em:'2026-11-16'}],distribuicao:[{nome:'Pianos e Teclados',quantidade:8},{nome:'Acessórios',quantidade:7},{nome:'Guitarras',quantidade:3},{nome:'Violões',quantidade:3}],adminAtual:false,usuarioAtual:null,quantidadeSacola:0,quantidadeFavoritos:0,produtosBusca:[],categoriasMenu:[{nome:'Guitarras'}],formatarValor:n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),imagemUrl:f=>(f||'').startsWith('https://')?f:'/uploads/'+f,imagemReserva:c=>'/img/acessorios.png',usuario:{id:1,nome:'Cliente',email:'cliente@example.com'},sucesso:'',erro:'',proximo:'/inicial',email:'',categorias:[],marcas:[],produtos:[],newsletterMsg:'',busca:'',filtros:{},produto:null,imagens:[],especificacoes:[],pedidos:[],fretes:[],configurado:false};
for(let f of ['admin/index-admin.ejs','usuario/inicial/index.ejs','usuario/novas/login.ejs','usuario/novas/cadastro.ejs','usuario/novas/conta.ejs']){
 let html=render(path.join(views,f),data);console.log('Renderizado',f,html.length,'bytes');
 if(f==='admin/index-admin.ejs'){
  if(!html.includes('Visão geral da loja')||!html.includes('Marcas cadastradas')||!html.includes('admin-workspace'))throw Error('Admin render incomplete');
  // A simulação só verifica o HTML; não modifica arquivos do projeto.
 }
 if(f==='usuario/novas/conta.ejs'){if(!html.includes('Meus pedidos')||!html.includes('Editar perfil'))throw Error('Perfil incompleto');}
 if(f==='usuario/novas/login.ejs'){if(!html.includes('Administrador')||!html.includes('value="admin"'))throw Error('Login admin incompleto');}
 if(f==='usuario/inicial/index.ejs'){
  if(html.indexOf('</main>')>html.indexOf('pianoWrapper'))throw Error('Footer/piano inside main');
  const indFooter=html.indexOf('<footer class="site-footer'),indPiano=html.indexOf('id="pianoWrapper"'),indMainClose=html.lastIndexOf('</main>');
  if(!(indMainClose<indPiano&&indPiano<indFooter))throw Error('Homepage layout nesting incorrect');
  console.log('Layout inicial main -> piano -> footer: OK');
 }
}
const src=fs.readFileSync(path.join(root,'rotas','loja.js'),'utf8');const match=src.match(/const nextPath=(.+);/);if(!match)throw Error('nextPath missing');const nextPath=new Function('return '+match[1])();
for(let req of [{query:{}},{query:{proximo:'/carrinho/confirmar'}},{body:{},query:{}},{body:{proximo:'/carrinho/confirmar'},query:{}}]){const destino=nextPath(req);if(!['/inicial','/carrinho/confirmar'].includes(destino))throw Error('Destino inválido');console.log('Redirecionamento:',destino);}
console.log('CHECKS PASSED');
