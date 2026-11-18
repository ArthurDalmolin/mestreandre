/* Mestre André Store - navegação e ações integradas com as rotas Express. */
function addToCart(id){
 const form=document.createElement('form');form.method='POST';form.action='/carrinho/adicionar/'+encodeURIComponent(id);document.body.append(form);form.submit();
}
function filterCategory(category){
 const mapped={teclas:'teclas',cordas:'cordas',bateria:'percussao',audio:'audio'};
 window.location.href='/catalogo?grupo='+encodeURIComponent(mapped[category]||category);
}
