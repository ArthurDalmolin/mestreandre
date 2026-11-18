const express = require('express');
const router = express.Router();
const { all, get, run } = require('../util/db');
const { FRETE, MUSICA, MINIMO_FRETE, NOTAS_MUSICA, resumo } = require('../util/cupons');

function cart(req) {
  if (!req.session.carrinho) req.session.carrinho = [];
  return req.session.carrinho;
}

async function getCart(req) {
  const carrinho = cart(req);
  if (!carrinho.length) return { itens: [], total: 0, totalItens: 0 };
  const ids = carrinho.map(i => i.id);
  const produtos = await all(`SELECT * FROM produtos WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
  const itens = carrinho.flatMap(item => {
    const produto = produtos.find(p => p.id === item.id);
    return produto ? [{ produto, quantidade: item.quantidade, subtotal: Number(produto.valor) * item.quantidade }] : [];
  });
  return {
    itens,
    total: Math.round(itens.reduce((s, i) => s + i.subtotal, 0) * 100) / 100,
    totalItens: itens.reduce((s, i) => s + i.quantidade, 0)
  };
}

function destino(req) {
  return req.body.origem === 'entrega' ? '/carrinho/confirmar' : '/carrinho';
}

router.get('/', async (req, res, next) => {
  try {
    const c = await getCart(req);
    res.render('usuario/carrinho_compra/index', {
      ...c, promocao: resumo(req, c.total), avisoCupom: req.query.cupom || ''
    });
  } catch (e) { next(e); }
});

router.post('/adicionar/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const produto = await get('SELECT id,estoque FROM produtos WHERE id=?', [id]);
    if (!produto) return res.status(404).render('usuario/novas/erro', { titulo: 'Produto não encontrado', mensagem: 'Este produto não está disponível.' });
    const quantidade = Math.min(50, Math.max(1, Number.parseInt(req.body.quantidade || 1, 10) || 1));
    const atual = cart(req), item = atual.find(i => i.id === id);
    if (produto.estoque <= 0) return res.redirect('/produto/' + id + '?frete=' + encodeURIComponent('Produto sem estoque.'));
    if (item) item.quantidade = Math.min(produto.estoque, item.quantidade + quantidade);
    else atual.push({ id, quantidade: Math.min(produto.estoque, quantidade) });
    res.redirect('/carrinho');
  } catch (e) { next(e); }
});
router.post('/diminuir/:id', (req, res) => {
  const id = Number(req.params.id), atual = cart(req), item = atual.find(i => i.id === id);
  if (item) { item.quantidade--; if (item.quantidade <= 0) req.session.carrinho = atual.filter(i => i.id !== id); }
  res.redirect('/carrinho');
});
router.post('/remover/:id', (req, res) => {
  req.session.carrinho = cart(req).filter(i => i.id !== Number(req.params.id));
  res.redirect('/carrinho');
});
router.post('/limpar', (req, res) => { req.session.carrinho = []; res.redirect('/carrinho'); });

// O piano manda as notas tocadas. A sequência é conferida também no servidor.
router.post('/piano-premio', express.json({ limit: '2kb' }), async (req, res, next) => {
  try {
    if (!Array.isArray(req.body?.notas) || req.body.notas.join(',') !== NOTAS_MUSICA.join(',')) {
      return res.status(400).json({ ok: false, mensagem: 'A sequência musical não corresponde.' });
    }
    if (req.session.usuario) {
      const usado = await get('SELECT id FROM pedidos WHERE usuario_id=? AND cupom_desconto=? LIMIT 1', [req.session.usuario.id, MUSICA]);
      if (usado) return res.status(409).json({ ok: false, mensagem: 'Você já usou o cupom musical nesta conta.' });
    }
    req.session.musicaLiberada = true;
    res.json({ ok: true, codigo: MUSICA, mensagem: 'Você ganhou 10% de desconto nos produtos!' });
  } catch (e) { next(e); }
});

router.post('/cupom', async (req, res, next) => {
  try {
    const codigo = String(req.body.codigo || '').trim().toUpperCase().replace(/\s/g, '');
    const pagina = destino(req);
    const c = await getCart(req);
    let mensagem = '';
    if (!c.itens.length) mensagem = 'Adicione produtos à sacola antes de usar um cupom.';
    else if (codigo === FRETE) {
      req.session.cupomFrete = FRETE;
      mensagem = c.total >= MINIMO_FRETE
        ? 'Cupom de frete grátis aplicado!'
        : 'Cupom guardado! Adicione mais produtos até atingir R$ 2.700,00.';
    } else if (codigo === MUSICA) {
      if (!req.session.musicaLiberada) mensagem = 'Toque a melodia secreta no piano do rodapé para liberar este cupom.';
      else {
        const usado = req.session.usuario && await get('SELECT id FROM pedidos WHERE usuario_id=? AND cupom_desconto=? LIMIT 1', [req.session.usuario.id, MUSICA]);
        if (usado) mensagem = 'Você já utilizou o cupom musical nesta conta.';
        else { req.session.cupomDesconto = MUSICA; mensagem = 'Cupom musical de 10% aplicado!'; }
      }
    } else mensagem = 'Cupom não encontrado. Confira o código informado.';
    res.redirect(pagina + '?cupom=' + encodeURIComponent(mensagem));
  } catch (e) { next(e); }
});
router.post('/remover-cupom', (req, res) => {
  if (req.body.tipo === 'frete') delete req.session.cupomFrete;
  if (req.body.tipo === 'desconto') delete req.session.cupomDesconto;
  res.redirect(destino(req) + '?cupom=' + encodeURIComponent('Cupom removido.'));
});

router.get('/confirmar', async (req, res, next) => {
  try {
    if (!req.session.usuario) return res.redirect('/login?proximo=' + encodeURIComponent('/carrinho/confirmar'));
    const c = await getCart(req);
    if (!c.itens.length) return res.redirect('/carrinho');
    const usuario = await get('SELECT id,nome,email FROM usuarios WHERE id=?', [req.session.usuario.id]);
    if (!usuario) return res.redirect('/login?proximo=' + encodeURIComponent('/carrinho/confirmar'));
    res.render('usuario/carrinho_compra/confirmar', {
      ...c, usuario, promocao: resumo(req, c.total), avisoCupom: req.query.cupom || '', erro: '',
      dados: { contato: '', entrega: 'retirada', endereco: '' }
    });
  } catch (e) { next(e); }
});

router.post('/finalizar', async (req, res, next) => {
  if (!req.session.usuario) return res.redirect('/login?proximo=' + encodeURIComponent('/carrinho/confirmar'));
  const contato = String(req.body.contato || '').trim().slice(0, 140);
  const entrega = String(req.body.entrega || '').trim();
  const endereco = String(req.body.endereco || '').trim().slice(0, 320);
  if (!contato || !['retirada', 'entrega'].includes(entrega) || (entrega === 'entrega' && endereco.length < 12)) {
    try {
      const c = await getCart(req);
      const usuario = await get('SELECT id,nome,email FROM usuarios WHERE id=?', [req.session.usuario.id]);
      return res.status(400).render('usuario/carrinho_compra/confirmar', {
        ...c, usuario, promocao: resumo(req, c.total), avisoCupom: '',
        erro: 'Informe um contato e, para entrega, um endereço completo com pelo menos 12 caracteres.',
        dados: { contato, entrega: entrega === 'entrega' ? 'entrega' : 'retirada', endereco }
      });
    } catch (e) { return next(e); }
  }
  let iniciouTransacao = false;
  try {
    const c = await getCart(req);
    if (!c.itens.length) return res.redirect('/carrinho');
    const promo = resumo(req, c.total);
    await run('BEGIN IMMEDIATE TRANSACTION'); iniciouTransacao = true;
    if (promo.cupomDesconto) {
      const usado = await get('SELECT id FROM pedidos WHERE usuario_id=? AND cupom_desconto=? LIMIT 1', [req.session.usuario.id, MUSICA]);
      if (usado) throw new Error('O cupom musical já foi usado nesta conta. Remova-o do carrinho para finalizar.');
    }
    for (const i of c.itens) {
      const result = await run('UPDATE produtos SET estoque=estoque-? WHERE id=? AND estoque>=?', [i.quantidade, i.produto.id, i.quantidade]);
      if (result.changes !== 1) throw new Error('Estoque insuficiente para ' + i.produto.nome + '. Volte ao carrinho e atualize os itens.');
    }
    const freteGratis = entrega === 'entrega' && promo.freteGratis;
    const result = await run(
      'INSERT INTO pedidos(usuario_id,valor_total,status,contato,entrega,endereco,subtotal_produtos,desconto,cupom_desconto,cupom_frete,frete_gratis) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      [req.session.usuario.id, promo.totalFinal, 'aguardando atendimento', contato, entrega, endereco, promo.subtotal, promo.desconto, promo.cupomDesconto || null, freteGratis ? promo.cupomFrete : null, freteGratis ? 1 : 0]
    );
    for (const i of c.itens) {
      await run('INSERT INTO pedido_itens(pedido_id,produto_id,nome,quantidade,preco_unitario) VALUES(?,?,?,?,?)', [result.lastID, i.produto.id, i.produto.nome, i.quantidade, i.produto.valor]);
    }
    await run('COMMIT'); iniciouTransacao = false;
    req.session.carrinho = [];
    delete req.session.cupomFrete;
    delete req.session.cupomDesconto;
    req.session.ultimoPedidoId = result.lastID;
    res.redirect('/carrinho/pedido/' + result.lastID);
  } catch (e) {
    if (iniciouTransacao) try { await run('ROLLBACK'); } catch (_) {}
    console.error(e);
    res.status(409).render('usuario/novas/erro', { titulo: 'Não foi possível registrar o pedido', mensagem: e.message });
  }
});
router.get('/confirmacao', async (req, res, next) => {
  try {
    if (!req.session.usuario) return res.redirect('/login');
    const ultimo = await get('SELECT id FROM pedidos WHERE usuario_id=? ORDER BY id DESC LIMIT 1', [req.session.usuario.id]);
    res.redirect(ultimo ? '/carrinho/pedido/' + ultimo.id : '/minha-conta');
  } catch (e) { next(e); }
});
router.get('/pedido/:id', async (req, res, next) => {
  try {
    if (!req.session.usuario) return res.redirect('/login');
    const pedido = await get('SELECT * FROM pedidos WHERE id=? AND usuario_id=?', [req.params.id, req.session.usuario.id]);
    if (!pedido) return res.redirect('/minha-conta');
    const itens = await all('SELECT * FROM pedido_itens WHERE pedido_id=?', [pedido.id]);
    res.render('usuario/carrinho_compra/pedido', { pedido, itens });
  } catch (e) { next(e); }
});
module.exports = router;
