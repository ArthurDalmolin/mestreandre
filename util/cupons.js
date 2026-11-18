// Regras simples para os dois cupons da loja.
const FRETE = 'FRETE2700';
const MUSICA = 'MESTRE10';
const MINIMO_FRETE = 2700;
// Início da cantiga tradicional, na região central do piano (4ª oitava).
const NOTAS_MUSICA = ['D4', 'D4', 'G4', 'G4', 'G4', 'A4', 'A4', 'B4'];

function resumo(req, subtotal) {
  const cupomFrete = req.session.cupomFrete === FRETE;
  const cupomMusica = req.session.cupomDesconto === MUSICA && req.session.musicaLiberada === true;
  const desconto = cupomMusica ? Math.round(subtotal * 10) / 100 : 0;
  return {
    subtotal,
    desconto,
    totalFinal: Math.round((subtotal - desconto) * 100) / 100,
    cupomDesconto: cupomMusica ? MUSICA : '',
    cupomFrete: cupomFrete ? FRETE : '',
    freteGratis: cupomFrete && subtotal >= MINIMO_FRETE,
    faltamFrete: Math.max(0, Math.round((MINIMO_FRETE - subtotal) * 100) / 100),
    minimoFrete: MINIMO_FRETE
  };
}
module.exports = { FRETE, MUSICA, MINIMO_FRETE, NOTAS_MUSICA, resumo };
