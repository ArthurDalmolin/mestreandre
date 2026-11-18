const opcoesOrdenacao = [
  'Recomendado →',
  'Menor Preço →',
  'Maior Preço →',
  'Mais Vendidos →'
];
let indiceAtual = 0;

function alternarOrdenacao() {
  indiceAtual = (indiceAtual + 1) % opcoesOrdenacao.length;
  document.getElementById('sortLabel').innerText = opcoesOrdenacao[indiceAtual];
}

function aplicarFiltros() {
  const selecionados = document.querySelectorAll('.filters-sidebar input[type="radio"]:checked');
  if (selecionados.length === 0) {
    alert('Selecione pelo menos uma opção de filtro.');
    return;
  }
  alert('Filtros aplicados com sucesso!');
}