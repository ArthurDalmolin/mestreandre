// Piano do rodapé: toca notas e reconhece o começo de "A Loja do Mestre André".
(function () {
  const teclas = document.querySelectorAll('.piano-divider .white[data-note], .piano-divider .black[data-note]');
  if (!teclas.length) return;
  const segredo = ['D4', 'D4', 'G4', 'G4', 'G4', 'A4', 'A4', 'B4'];
  const nomes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let contextoAudio;
  let passos = 0;
  let premioMostrado = false;

  function nomeDaNota(frequencia) {
    const numero = Math.round(69 + 12 * Math.log2(frequencia / 440));
    return nomes[(numero % 12 + 12) % 12] + (Math.floor(numero / 12) - 1);
  }

  function mostrarPremio(codigo) {
    if (document.getElementById('pianoPremio')) return;
    const fundo = document.createElement('div');
    fundo.id = 'pianoPremio';
    fundo.className = 'piano-premio-fundo';
    fundo.innerHTML = '<div class="piano-premio-caixa" role="dialog" aria-modal="true" aria-labelledby="pianoPremioTitulo">' +
      '<button type="button" class="piano-premio-fechar" aria-label="Fechar">×</button>' +
      '<span class="piano-premio-icone">🎹</span>' +
      '<h2 id="pianoPremioTitulo">Você acertou a melodia!</h2>' +
      '<p>Parabéns! Você ganhou <strong>10% de desconto</strong> nos produtos da Mestre André Store.</p>' +
      '<div class="piano-premio-codigo"></div>' +
      '<button type="button" class="piano-premio-copiar">Copiar cupom</button>' +
      '<a href="/carrinho" class="piano-premio-ver">Usar na sacola</a>' +
      '<small>Válido uma vez por conta. Digite o código na sacola para aplicar o desconto.</small>' +
      '</div>';
    document.body.appendChild(fundo);
    fundo.querySelector('.piano-premio-codigo').textContent = codigo;
    const fechar = () => fundo.remove();
    fundo.querySelector('.piano-premio-fechar').addEventListener('click', fechar);
    fundo.addEventListener('click', e => { if (e.target === fundo) fechar(); });
    const sair = e => { if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', sair); } };
    document.addEventListener('keydown', sair);
    fundo.querySelector('.piano-premio-fechar').focus();
    fundo.querySelector('.piano-premio-copiar').addEventListener('click', async e => {
      try {
        await navigator.clipboard.writeText(codigo);
        e.currentTarget.textContent = 'Cupom copiado!';
      } catch (_) {
        window.prompt('Copie o código do cupom:', codigo);
      }
    });
  }

  async function conferirSegredo(nota) {
    if (premioMostrado) return;
    if (nota === segredo[passos]) passos++;
    else passos = nota === segredo[0] ? 1 : 0;
    if (passos !== segredo.length) return;
    passos = 0;
    premioMostrado = true;
    try {
      const resposta = await fetch('/carrinho/piano-premio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: segredo })
      });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.ok) throw new Error(dados.mensagem || 'Não foi possível registrar o prêmio.');
      mostrarPremio(dados.codigo);
    } catch (erro) {
      premioMostrado = false;
      alert(erro.message || 'A sequência está correta, mas não foi possível liberar o cupom.');
    }
  }

  function tocar(tecla) {
    const frequencia = Number(tecla.dataset.note);
    if (!frequencia) return;
    tecla.classList.add('pressed');
    setTimeout(() => tecla.classList.remove('pressed'), 140);
    // O som é reproduzido no próprio navegador, sem arquivo de áudio externo.
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) {
        if (!contextoAudio) contextoAudio = new Audio();
        if (contextoAudio.state === 'suspended') contextoAudio.resume();
        const oscilador = contextoAudio.createOscillator();
        const volume = contextoAudio.createGain();
        oscilador.type = 'triangle';
        oscilador.frequency.setValueAtTime(frequencia, contextoAudio.currentTime);
        volume.gain.setValueAtTime(0.16, contextoAudio.currentTime);
        volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.9);
        oscilador.connect(volume);
        volume.connect(contextoAudio.destination);
        oscilador.start();
        oscilador.stop(contextoAudio.currentTime + 0.9);
      }
    } catch (e) { /* Mesmo sem áudio, o piano continua aceitando cliques. */ }
    conferirSegredo(nomeDaNota(frequencia));
  }

  teclas.forEach(tecla => {
    tecla.setAttribute('role', 'button');
    tecla.setAttribute('tabindex', '0');
    tecla.setAttribute('aria-label', 'Tocar nota ' + nomeDaNota(Number(tecla.dataset.note)));
    tecla.addEventListener('pointerdown', e => { e.stopPropagation(); tocar(tecla); });
    tecla.addEventListener('pointerenter', e => { if (e.buttons === 1) { e.stopPropagation(); tocar(tecla); } });
    tecla.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); tocar(tecla); }
    });
  });
})();
