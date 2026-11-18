document.addEventListener('DOMContentLoaded',()=>{
 const main=document.getElementById('mainProductImg');
 document.querySelectorAll('.thumbnail-strip .thumb-box').forEach(button=>button.addEventListener('click',()=>{
  main.src=button.dataset.image;
  document.querySelectorAll('.thumbnail-strip .thumb-box').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
  button.classList.add('active');button.setAttribute('aria-pressed','true');
 }));
 const cep=document.getElementById('cepInput');cep?.addEventListener('input',()=>{const v=cep.value.replace(/\D/g,'').slice(0,8);cep.value=v.length>5?v.slice(0,5)+'-'+v.slice(5):v;});
});
