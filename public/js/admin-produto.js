const campo=document.getElementById('specCampos');
const templates={
 'piano':['Teclado','Quantidade de teclas','Polifonia','Timbres / vozes','Conexões','Pedais','Dimensões / peso','Conteúdo da caixa'],
 'teclado':['Teclas','Polifonia','Timbres','Ritmos','Conexões','Alimentação','Dimensões / peso'],
 'guitarra':['Corpo / madeira','Braço','Escala','Captadores','Ponte','Número de cordas','Cor / acabamento','Acessórios inclusos'],
 'violão':['Formato','Tampo','Laterais e fundo','Escala','Cordas','Captação','Acabamento','Acessórios inclusos'],
 'baixo':['Número de cordas','Corpo','Braço','Captadores','Escala','Eletrônica','Ponte'],
 'bateria':['Configuração','Cascos','Tamanhos dos tambores','Ferragens','Pratos inclusos','Acabamento','Conteúdo da caixa'],
 'saxofone':['Afinação','Acabamento','Material','Chaves','Boquilha','Estojo'],
 'flauta':['Afinação','Material','Sistema de chaves','Tipo de pé','Estojo'],
 'trompete':['Afinação','Calibre','Campana','Acabamento','Pistões','Estojo'],
 'clarinete':['Afinação','Material','Sistema de chaves','Boquilha','Estojo'],
 'outro':['Material','Cor / acabamento','Dimensões / peso','Compatibilidade','Conteúdo da caixa']
};
function adicionarCampo(chave='',valor=''){
 const row=document.createElement('div');row.className='row g-2 mb-2 spec-item';if(window.__autoSpecs)row.dataset.auto='1';
 const c1=document.createElement('div');c1.className='col-md-4';
 const a=document.createElement('input');a.className='form-control';a.name='spec_chave[]';a.placeholder='Ex.: Teclado';a.maxLength=90;a.value=chave;c1.append(a);
 const c2=document.createElement('div');c2.className='col-md-7';
 const b=document.createElement('input');b.className='form-control';b.name='spec_valor[]';b.placeholder='Especificação deste instrumento';b.maxLength=700;b.value=valor;c2.append(b);
 const c3=document.createElement('div');c3.className='col-md-1';const del=document.createElement('button');del.type='button';del.className='btn btn-outline-danger';del.innerText='×';del.addEventListener('click',()=>row.remove());c3.append(del);
 row.append(c1,c2,c3);campo.append(row);
}
document.querySelectorAll('.btn-remover-spec').forEach(b=>b.addEventListener('click',()=>b.closest('.spec-item').remove()));
document.getElementById('addSpec')?.addEventListener('click',()=>adicionarCampo());
const category=document.getElementById('categoriaProduto');
function sugerir(){
 const current=[...campo.querySelectorAll('.spec-item')];
 if(current.some(r=>!r.dataset.auto))return;
 if(current.some(r=>r.querySelector('[name="spec_valor[]"]')?.value.trim()))return;
 current.forEach(r=>r.remove());
 window.__autoSpecs=true;
 const escolha=(category.value||'').toLowerCase();const key=Object.keys(templates).find(k=>escolha.includes(k))||'outro';
 templates[key].forEach(chave=>adicionarCampo(chave));
 window.__autoSpecs=false;
}
category?.addEventListener('change',sugerir);
if(!campo.querySelector('.spec-item'))sugerir();
document.getElementById('imagensProduto')?.addEventListener('change',function(){
 const area=document.getElementById('previewUploads');area.replaceChildren();
 [...this.files].slice(0,8).forEach(file=>{const img=new Image();img.src=URL.createObjectURL(file);img.style='width:100px;height:100px;object-fit:contain;border:1px solid #ddd;border-radius:6px';img.onload=()=>URL.revokeObjectURL(img.src);area.append(img);});
 if(this.files.length>8)alert('Selecione no máximo 8 imagens.');
});
