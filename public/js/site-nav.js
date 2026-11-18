document.addEventListener('DOMContentLoaded',()=>{
 const input=document.getElementById('campoBusca'),box=document.getElementById('listaResultadosBusca');
 if(!input||!box)return;
 const items=box.querySelectorAll('.search-result-item'),none=box.querySelector('#msgSemResultado');
 const update=()=>{const text=input.value.trim().toLocaleLowerCase('pt-BR');box.classList.toggle('d-none',!text);let found=0;items.forEach(item=>{const hit=!!text&&((item.dataset.nome||'')+' '+(item.dataset.marca||'')).toLocaleLowerCase('pt-BR').includes(text);item.classList.toggle('d-none',!hit);if(hit)found++;});none?.classList.toggle('d-none',found>0);};
 input.addEventListener('input',update);input.addEventListener('focus',update);
 document.addEventListener('pointerdown',e=>{if(!box.closest('form').contains(e.target))box.classList.add('d-none');});
});
