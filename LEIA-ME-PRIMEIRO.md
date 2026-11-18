IMPORTANTE: leia também ALTERACOES-V6.md para login administrador, fotos e preservação de dados.

# Mestre André Store — versão 4

Projeto didático em **Node.js + Express + EJS + SQLite**. Esta versão corrige o fluxo de entrega/pedidos, exibe o login e o cadastro no menu, centraliza a busca e traz um catálogo de demonstração preenchido.

## Para rodar no Windows

1. Extraia o ZIP completo.
2. Abra no VS Code a **pasta `mestre-andre-store` que contém `package.json` e `app.js`**.
3. Instale uma versão LTS do Node.js em https://nodejs.org e reinicie o VS Code se `npm` não for reconhecido.
4. No terminal, execute `npm install` e depois `npm start`.
5. Acesse `http://localhost:3000/inicial`.

Se já instalou `node_modules` na pasta anterior, pode copiar para a nova pasta após extrair; entretanto, se houver conflitos, prefira executar `npm install` na pasta nova.

## Páginas e caminhos

- `http://localhost:3000/inicial` — página principal da loja, com catálogo e piano.
- `http://localhost:3000/boas-vindas` — **página onde o visitante informa o e-mail** para começar o cadastro.
- `http://localhost:3000/login` — login.
- `http://localhost:3000/cadastro` — criar conta.
- `http://localhost:3000/catalogo` — catálogo completo e pesquisa centralizada.
- `http://localhost:3000/carrinho` — sacola.
- `http://localhost:3000/carrinho/confirmar` — dados para entrega e revisão dos produtos reais do carrinho; requer login e carrinho preenchido.
- `http://localhost:3000/carrinho/confirmacao` — **último pedido confirmado** da conta atual; sem pedido anterior, leva a Minha conta.
- `http://localhost:3000/minha-conta` — histórico de pedidos; cada número abre a confirmação desse pedido.
- `http://localhost:3000/admin` — área administrativa; cadastre primeiro uma senha no computador local.

**Fluxo de teste completo:** `/catalogo` → clicar em um instrumento → Adicionar à sacola → `/carrinho` → Continuar para entrega → entrar ou cadastrar → escolher retirada/entrega e preencher contato/endereço → Registrar pedido → página de confirmação. O total e os itens vêm do banco SQLite, e o pedido passa a constar no histórico do usuário e na lista de pedidos do admin.

Se a entrega não exibir produtos, volte a `/carrinho` e adicione itens usando os botões de compra. O carrinho acompanha a sessão do navegador. Se já estiver usando outra versão aberta, feche o servidor antigo (`Ctrl+C`), abra a pasta **desta versão** e reinicie.

## Catálogo inicial de demonstração

O banco `banco/ecommerce.db` entregue já está preenchido. Foram adicionados **20 itens** a um produto original existente, além de **12 marcas** e **8 novas categorias** (total de 9). São modelos comerciais reais, com características técnicas correspondentes. **Preços, estoques e imagens SVG são ilustrativos**, não anúncios ou cotações comerciais confirmadas; as artes são identificadas como ilustrativas para não parecerem fotos oficiais.

Os 20 novos produtos têm **2 ilustrações locais e uma ficha técnica personalizada**, prontas para testar a seleção de miniaturas na página de produto e a edição de imagens no admin. Estão no arquivo `dados/catalogo-demonstracao.json`. Para repovoar outro banco, execute **uma única vez** `npm run popular`; o comando pode ser repetido sem duplicar produtos, marcas ou categorias. Não apaga seus produtos existentes.

## Testes

Execute `npm run testar` para validar cadastro, login, favoritos, marcas, upload múltiplo, carrinho, resumo de entrega, confirmação, pedido, estoque e páginas principais em um **banco temporário**. O teste não altera o banco real.

Nesta entrega, a sintaxe dos scripts e dos templates EJS foi analisada, as imagens de produtos foram verificadas e a integridade do banco foi testada. **Não foi possível executar o teste HTTP real aqui porque a instalação das dependências não terminou neste ambiente.** Execute `npm install` e `npm run testar` no computador para validar o servidor completo.

## Limites conhecidos

O pedido é registrado para atendimento da loja. Não existe cobrança automática, cotação real de frete, envio real de e-mail de recuperação nem autenticação via Google/Facebook. Essas integrações demandam serviços, credenciais e configuração adicionais. O cadastro de newsletter salva e-mails no SQLite. O formulário de boas-vindas envia o e-mail pré-preenchido para o cadastro.

Atenção: dados comerciais do catálogo são demonstrativos. Antes de publicar o site, substitua imagens por fotos autorizadas de cada SKU, confira preços, estoque, disponibilidade e informações oficiais de produtos.
