document.addEventListener('DOMContentLoaded',function(){
 var tabs=document.querySelectorAll('.profile-tab');
 var orders=document.querySelectorAll('.profile-order');
 var aviso=document.getElementById('semPedidosFiltro');
 tabs.forEach(function(tab){tab.addEventListener('click',function(){
  var filtro=tab.getAttribute('data-filtro'),visiveis=0;
  tabs.forEach(function(t){t.classList.toggle('active',t===tab);});
  orders.forEach(function(p){var mostrar=filtro==='todos'||p.getAttribute('data-status')===filtro;p.hidden=!mostrar;if(mostrar)visiveis++;});
  aviso.hidden=visiveis!==0;
 });});
});
