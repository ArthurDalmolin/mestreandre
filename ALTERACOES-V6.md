# Mestre André Store – Versão 6 (16/11/2026)

## O que mudou

1. Perfil (`/minha-conta`) redesenhado com base na referência: nome, e-mail, histórico real de pedidos, itens, valores, status e filtros. A seção “Editar perfil” permite mudar nome e e-mail sem apagar pedidos. Não são criados pedidos fictícios.
2. Pesquisa menor (máximo de 320 px no computador; 350 px em segunda linha de telas médias), preservando o botão “Início”.
3. Login único (`/login`) tem as opções Cliente e Administrador. Ao selecionar Administrador e informar o e-mail administrativo e sua senha já configurada, é direcionado a `/admin/index`. A senha não é exibida nem tem valor padrão.
4. Botão do WhatsApp presente em todas as páginas que usam o footer compartilhado. O número informado foi entendido como DDD (49) do Brasil: (49) 99821-7691. Link: https://wa.me/5549998217691.
5. As 20 ilustrações SVG dos produtos de demonstração foram trocadas no banco por links para fotografias dos modelos correspondentes. Veja `dados/fotografias-produtos.json`. As fotos são **externas** e podem deixar de funcionar; quando isso acontecer, o site tenta exibir uma fotografia genérica local do tipo de instrumento. Para publicar a loja, obtenha autorização do titular da fotografia ou use fotografias próprias e cadastre-as pelo admin.
6. Categorias no cabeçalho recolhidas por padrão usando `<details>` e `<summary>`. A seção “Qual é o seu instrumento?” também pode ser aberta e fechada.

## Como entrar como administrador

Na primeira vez, configure uma senha acessando `/admin/configurar` no próprio computador. Se a V5 já tem senha administrativa, **use a mesma**, sem redefinir. Na página `/login`, escolha “Administrador”, digite `admin@mestreandrestore.local` (e-mail padrão de acesso para bancos anteriores) e a senha administrativa. Na área admin, o menu “Configurações” permite mudar o e-mail mediante confirmação da senha.

## Como usar sem perder dados do seu computador

Se você já tem dados novos cadastrados na V5, **não substitua o arquivo `banco/ecommerce.db` pelo do ZIP**. Copie seu `banco/ecommerce.db` antigo para a nova pasta `banco` antes de iniciar. Inicie o servidor para aplicar a coluna `admin_config.email` e, com o servidor fechado, execute `npm run atualizar:fotos`. Esse comando modifica somente fotos SVG demonstrativas e mantém suas fotos personalizadas e demais dados.

### Terminal

```bash
npm install
npm start
```

Quando quiser converter as fotos antigas do seu banco atual:

```bash
npm run atualizar:fotos
```

Verificação estrutural, mesmo sem módulos instalados: `npm run verificar:estrutura`. Teste integrado (requer `npm install`): `npm run testar`.

## Para entender e apresentar o código

- `<% ... %>` executa um `if`, `forEach` ou outra instrução de JavaScript no template EJS.
- `<%= ... %>` mostra um valor, como nome, preço e status.
- `<%- include('...') %>` insere o mesmo cabeçalho e rodapé em várias páginas.
- Os filtros de pedidos estão em `public/js/perfil.js` e usam `addEventListener` e `hidden`, sem frameworks novos.
- O banco é SQLite (`banco/ecommerce.db`), acessado pelas rotas Express de `rotas/loja.js`.
- Para segurança, a verificação de senhas do administrador continua usando `bcryptjs`, que já fazia parte do projeto. Não substitua hash de senha por senha em texto puro.

## Limites da verificação

Os arquivos JS passaram por `node --check`; 37 templates EJS passaram pela compilação e cinco páginas foram renderizadas no teste estático. A integridade do SQLite deu `ok`. **Não foi possível executar o teste HTTP completo** neste ambiente sem baixar dependências. As fotos externas e o link do WhatsApp dependem de internet. Verifique visualmente o site no navegador local antes da entrega.
