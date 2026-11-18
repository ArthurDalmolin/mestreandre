document.addEventListener('DOMContentLoaded',()=>{
 const radios=document.querySelectorAll('input[name="entrega"]');
 const box=document.getElementById('enderecoCampos');
 const address=document.getElementById('endereco');
 function update(){const selected=document.querySelector('input[name="entrega"]:checked');const needsAddress=selected?.value==='entrega';if(box)box.hidden=!needsAddress;if(address)address.required=!!needsAddress;}
 radios.forEach(radio=>radio.addEventListener('change',update));update();
});
