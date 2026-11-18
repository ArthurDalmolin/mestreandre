// Renderiza telas EJS de cupons sem exigir pacote externo, útil para conferência básica.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function render(file, data) {
  let source = fs.readFileSync(file, 'utf8');
  const reg = /<%([=-]?)([\s\S]*?)%>/g;
  let js = 'let out="";\n', pos = 0, match;
  while ((match = reg.exec(source))) {
    js += 'out+=' + JSON.stringify(source.slice(pos, match.index)) + ';\n';
    if (match[1] === '=') js += 'out+=escapeHtml(' + match[2] + ');\n';
    else if (match[1] === '-') js += 'out+=String((' + match[2] + ')??"");\n';
    else js += match[2] + '\n';
    pos = reg.lastIndex;
  }
  js += 'out+=' + JSON.stringify(source.slice(pos)) + ';\nreturn out;';
  const include = (part, vars={}) => render(path.resolve(path.dirname(file), part.endsWith('.ejs') ? part : part+'.ejs'), {...data, ...vars});
  return new Function('locals','escapeHtml','include','with(locals){\n'+js+'\n}')(data,escapeHtml,include);
}
const produto = { id: 1, nome: 'Piano de teste', marca: 'Yamaha', imagem: 'piano.png', categoria: 'Pianos e Teclados', valor: 2700, estoque: 4 };
const item = { produto, quantidade: 1, subtotal: 2700 };
const promo = { subtotal:2700,desconto:270,totalFinal:2430,cupomFrete:'FRETE2700',cupomDesconto:'MESTRE10',freteGratis:true,faltamFrete:0,minimoFrete:2700 };
const dados = { itens:[item], total:2700, totalItens:1, promocao:promo, avisoCupom:'Cupom aplicado!',
 usuario:{id:1,nome:'Cliente teste',email:'teste@example.com'}, erro:'',
 dados:{contato:'',entrega:'retirada',endereco:''},
 pedido:{id:10,valor_total:2430,subtotal_produtos:2700,desconto:270,cupom_desconto:'MESTRE10',cupom_frete:'FRETE2700',frete_gratis:1,entrega:'entrega',contato:'(49) 99999-0000',endereco:'Rua exemplo',status:'aguardando',criado_em:'2026-11-18'},
 imagemUrl:f=>'/uploads/'+f,imagemReserva:()=>'/img/teclados.png',formatarValor:n=>'R$ '+Number(n).toFixed(2),
 adminAtual:false,usuarioAtual:{id:1,nome:'Cliente teste'},quantidadeSacola:1,quantidadeFavoritos:0,produtosBusca:[],categoriasMenu:[],
};
const views = ['index.ejs','confirmar.ejs','pedido.ejs'];
for (const file of views) {
  let output = render(path.join(root,'views/usuario/carrinho_compra',file),{...dados, ...(file==='pedido.ejs'?{itens:[{nome:'Piano de teste',preco_unitario:2700,quantidade:1}]}:{})});
  assert(output.includes('R$ 2430.00'),file+' não mostrou o total com desconto');
  assert(output.includes('MESTRE10'),file+' não mostrou cupom');
  assert(output.includes('FRETE2700'),file+' não mostrou frete');
  console.log('OK:',file,'renderizado');
}
