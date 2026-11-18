# Mestre André Store - Versão 5

## Correções desta versão

- Login e cadastro: a rota GET agora lê `proximo` com segurança, sem tentar acessar `req.body` indefinido. O retorno ao checkout é preservado quando enviado no endereço ou no formulário.
- Página inicial: as seções ficam dentro de um `<main class="home-main">`, separado do piano e do rodapé. Removidas regras antigas que deslocavam footer/piano em 50vw, e definido o layout compartilhado em largura integral.
- Administração: novo painel com menu lateral consistente nas páginas de gestão, cabeçalho público, piano e rodapé; cards de produtos, marcas, categorias e pedidos; atalhos diretos; últimos produtos, pedidos recentes e distribuição real de produtos por categoria.
- Cadastros já existentes de produtos, marcas, categorias, fotos e especificações foram preservados. Nenhum produto do banco foi apagado.

## Como iniciar no Windows / VS Code

1. Extraia o ZIP e **abra a pasta interna `mestre-andre-store`**, que contém `package.json`.
2. Abra o terminal nessa pasta.
3. Execute `npm install` (uma vez) e `npm start`.
4. Abra http://localhost:3000/inicial, http://localhost:3000/login, http://localhost:3000/cadastro e http://localhost:3000/admin.
5. Na primeira visita ao admin, configure a senha local e acesse `/admin/index`.

## Conferência

- `npm run verificar:estrutura`: análise estática de templates EJS e simulação de renderização do painel, início, login e cadastro; não depende das bibliotecas npm.
- `npm run testar`: teste de integração HTTP, com banco temporário. Requer instalação completa das dependências via `npm install`.

Nesta edição foram validados os arquivos JavaScript com `node --check`, a compilação estática dos 36 templates EJS, o código de seleção do destino do login e a integridade do SQLite. O ambiente utilizado para preparar este ZIP não teve acesso ao registro do npm, então **não foi possível executar o servidor e os testes HTTP reais**. A revisão visual em navegador também não foi concluída neste ambiente; verifique especialmente o alinhamento do footer nas dimensões de tela usadas na apresentação.

### Importante

- O cadastro de produtos continua aceitando múltiplas imagens e especificações próprias por instrumento.
- O pagamento online e o login social dependem de integrações externas: não são processados por este projeto didático.
- Use o mesmo `banco/ecommerce.db` que está no ZIP para ver os produtos cadastrados anteriormente. Se você já cadastrou novos produtos localmente, **faça uma cópia do banco atual antes de substituir a pasta**.
