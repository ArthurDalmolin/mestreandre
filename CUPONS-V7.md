# Cupons e piano musical (V7)

Este projeto usa HTML, CSS, JavaScript, EJS e rotas Express existentes. Não foram adicionadas dependências npm novas.

## 1. Cupom de frete grátis

- **Código:** `FRETE2700`
- **Regra:** frete grátis apenas para pedidos com **R$ 2.700,00 ou mais em produtos**, antes dos outros descontos.
- Ele pode ser inserido mesmo com a compra abaixo de R$ 2.700,00, mas só passa a valer quando o carrinho atinge o mínimo.
- No caso de retirada, frete não se aplica. Em entregas sem cupom, o frete continua sob consulta, como já era no projeto.
- Este projeto é didático e não cobra frete ou pagamento online; o campo `frete_gratis` é salvo no pedido para o atendimento respeitar a promoção.

## 2. Cupom musical

- **Código:** `MESTRE10`
- Toque no piano do rodapé, na quarta oitava: **Ré4, Ré4, Sol4, Sol4, Sol4, Lá4, Lá4, Si4**.
- Essas notas são uma adaptação curta do começo da cantiga tradicional "Loja do Mestre André", em Sol maior.
- Ao completar a sequência, o navegador solicita ao servidor que libere o cupom na sessão e mostra o pop-up.
- Depois, copie `MESTRE10`, vá à sacola e digite o código.
- O cupom dá **10% de desconto sobre os produtos** e pode ser utilizado **uma vez por conta**. O histórico de uso é verificado na tabela `pedidos`.
- Os cupons de frete e de 10% podem ser usados juntos. O mínimo de R$ 2.700,00 considera os produtos antes do desconto musical.
- Se a pessoa tocar o piano antes de fazer login, os cupons serão preservados ao entrar, sem perder o carrinho.

## Arquivos principais

- `util/cupons.js`: regras dos cupons e sequência de notas.
- `rotas/rotas-carrinho.js`: aplicação e remoção dos cupons, liberação do prêmio e registro dos valores no banco.
- `banco/database.js`: adiciona campos opcionais aos pedidos existentes; os dados antigos não são apagados.
- `public/js/piano.js`: toca o piano, confere as notas e abre a janela do prêmio.
- `public/css/site-shared.css`: aparência da janela do prêmio.
- `views/usuario/partials/cupons.ejs`: campo para aplicar os cupons.
- `views/usuario/carrinho_compra`: sacola, entrega e confirmação.

## Executar e testar

```bash
npm install
npm start
```

Abra `http://localhost:3000/inicial` e teste o piano no rodapé, a sacola e a entrega.

Para testar somente os cálculos de promoção sem instalar dependências:

```bash
npm run testar:cupons
```

**Atenção:** preserve seu arquivo `banco/ecommerce.db` ao atualizar para esta versão se você tiver usuários, pedidos ou produtos cadastrados localmente. O banco fornecido no ZIP é demonstrativo.
