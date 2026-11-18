const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(process.env.DB_PATH || path.join(__dirname, 'ecommerce.db'), err => {
  if (err) console.error('Erro de banco:', err.message);
  else console.log('Banco conectado.');
});
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run('CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, descricao TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS marcas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, imagem TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS produtos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, categoria TEXT, marca TEXT, valor REAL, estoque INTEGER DEFAULT 0, descricao TEXT, imagem TEXT, nivel TEXT, modelo TEXT, cor TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, cpf TEXT, senha TEXT, senha_hash TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS recuperacoes (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, token_hash TEXT UNIQUE NOT NULL, expira INTEGER NOT NULL)');
  db.run('CREATE TABLE IF NOT EXISTS newsletter (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL)');
  db.run('CREATE TABLE IF NOT EXISTS favoritos (usuario_id INTEGER NOT NULL, produto_id INTEGER NOT NULL, PRIMARY KEY(usuario_id,produto_id))');
  db.run('CREATE TABLE IF NOT EXISTS produto_imagens (id INTEGER PRIMARY KEY AUTOINCREMENT, produto_id INTEGER NOT NULL, arquivo TEXT NOT NULL, ordem INTEGER DEFAULT 0, FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE)');
  db.run('CREATE TABLE IF NOT EXISTS produto_especificacoes (id INTEGER PRIMARY KEY AUTOINCREMENT, produto_id INTEGER NOT NULL, chave TEXT NOT NULL, valor TEXT NOT NULL, FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE)');
  db.run('CREATE TABLE IF NOT EXISTS avaliacoes (id INTEGER PRIMARY KEY AUTOINCREMENT, produto_id INTEGER NOT NULL, usuario_id INTEGER NOT NULL, nota INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5), comentario TEXT NOT NULL, criado_em TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(produto_id,usuario_id), FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE)');
  db.run('CREATE TABLE IF NOT EXISTS admin_config (id INTEGER PRIMARY KEY CHECK(id=1), senha_hash TEXT NOT NULL)');
  db.run('CREATE TABLE IF NOT EXISTS pedidos (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, valor_total REAL NOT NULL, status TEXT NOT NULL DEFAULT \'aguardando atendimento\', criado_em TEXT DEFAULT CURRENT_TIMESTAMP, contato TEXT, entrega TEXT, endereco TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS pedido_itens (id INTEGER PRIMARY KEY AUTOINCREMENT, pedido_id INTEGER NOT NULL, produto_id INTEGER NOT NULL, nome TEXT NOT NULL, quantidade INTEGER NOT NULL, preco_unitario REAL NOT NULL, FOREIGN KEY(pedido_id) REFERENCES pedidos(id))');
  db.run('CREATE TABLE IF NOT EXISTS frete_consultas (id INTEGER PRIMARY KEY AUTOINCREMENT, produto_id INTEGER NOT NULL, usuario_id INTEGER, cep TEXT NOT NULL, criado_em TEXT DEFAULT CURRENT_TIMESTAMP, contato TEXT)');
  function ensure(table, column, type) {
    db.all(`PRAGMA table_info(${table})`, (err, cols) => {
      if (!err && !cols.some(c => c.name === column)) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, e => { if (e) console.error('Migração:', e.message); });
      }
    });
  }
  ensure('usuarios','senha_hash','TEXT');
  ensure('usuarios','cpf','TEXT');
  ensure('usuarios','senha','TEXT');
  ensure('marcas','imagem','TEXT');
  ensure('produtos','modelo','TEXT');
  ensure('produtos','cor','TEXT');
  ensure('pedidos','contato','TEXT');
  ensure('pedidos','entrega','TEXT');
  ensure('pedidos','endereco','TEXT');
  ensure('pedidos','subtotal_produtos','REAL');
  ensure('pedidos','desconto','REAL DEFAULT 0');
  ensure('pedidos','cupom_desconto','TEXT');
  ensure('pedidos','cupom_frete','TEXT');
  ensure('pedidos','frete_gratis','INTEGER DEFAULT 0');
  ensure('frete_consultas','contato','TEXT');
  ensure('admin_config','email','TEXT');
});
module.exports = db;
