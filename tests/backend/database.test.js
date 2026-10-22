const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../../backend/config/database');
const Database = db.constructor;

test('Deve estabelecer conexão com o banco SQLite', () => {
  const resultado = db.prepare('SELECT 1 AS conectado').get();

  assert.equal(resultado.conectado, 1);
});

test('Deve manter a integridade referencial habilitada', () => {
  const resultado = db.pragma('foreign_keys', { simple: true });

  assert.equal(resultado, 1);
});

test('Deve verificar a existência da tabela usuarios', () => {
  const resultado = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'usuarios'
  `).get();

  assert.equal(resultado.name, 'usuarios');
});

test('Deve verificar a existência da tabela solicitacoes', () => {
  const resultado = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'solicitacoes'
  `).get();

  assert.equal(resultado.name, 'solicitacoes');
});

test('Deve verificar a existência da tabela historico_solicitacoes', () => {
  const resultado = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'historico_solicitacoes'
  `).get();

  assert.equal(resultado.name, 'historico_solicitacoes');
});

test('Deve rejeitar perfil de usuário inválido', () => {
  const bancoTeste = new Database(':memory:');

  bancoTeste.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL
        CHECK (perfil IN ('PACIENTE', 'ADMIN'))
    );
  `);

  assert.throws(() => {
    bancoTeste.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil)
      VALUES (?, ?, ?, ?)
    `).run('Teste', 'teste@exemplo.com', 'hash_teste', 'INVALIDO');
  }, /CHECK constraint failed/);

  bancoTeste.close();
});

test('Deve rejeitar cadastro de usuarios com email duplicado', () => {
  const bancoTeste = new Database(':memory:');

  bancoTeste.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL
        CHECK (perfil IN ('PACIENTE', 'ADMIN'))
    );
  `);

  const inserirUsuario = bancoTeste.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `);

  inserirUsuario.run(
    'Usuario Teste 1',
    'teste@exemplo.com',
    'hash_teste_1',
    'PACIENTE'
  );

  assert.throws(() => {
    inserirUsuario.run(
      'Usuario Teste 2',
      'teste@exemplo.com',
      'hash_teste_2',
      'PACIENTE'
    );
  }, /UNIQUE constraint failed/);

  bancoTeste.close();
});

test('Deve rejeitar cadastro de usuario sem nome', () => {
  const bancoTeste = new Database(':memory:');

  bancoTeste.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL
        CHECK (perfil IN ('PACIENTE', 'ADMIN'))
    );
  `);

  const inserirUsuario = bancoTeste.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `);

  assert.throws(() => {
    inserirUsuario.run(
      null,
      'teste@exemplo.com',
      'hash_teste',
      'PACIENTE'
    );
  }, /NOT NULL constraint failed/);

  bancoTeste.close();
});

test('Deve rejeitar cadastro de usuario sem senha_hash', () => {
  const bancoTeste = new Database(':memory:');

  bancoTeste.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL
        CHECK (perfil IN ('PACIENTE', 'ADMIN'))
    );
  `);

  const inserirUsuario = bancoTeste.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `);

  assert.throws(() => {
    inserirUsuario.run(
      'Usuario Teste',
      'teste@exemplo.com',
      null,
      'PACIENTE'
    );
  }, /NOT NULL constraint failed/);

  bancoTeste.close();
});

test('Deve rejeitar cadastro de usuario sem email', () => {
  const bancoTeste = new Database(':memory:');

  bancoTeste.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL
        CHECK (perfil IN ('PACIENTE', 'ADMIN'))
    );
  `);

  const inserirUsuario = bancoTeste.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `);

  assert.throws(() => {
    inserirUsuario.run(
      'Usuario Teste',
      null,
      'hash_teste',
      'PACIENTE'
    );
  }, /NOT NULL constraint failed/);

  bancoTeste.close();
});

function criarBancoSolicitacoesTeste() {
  const bancoTeste = new Database(':memory:');

  bancoTeste.pragma('foreign_keys = ON');

  bancoTeste.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL
        CHECK (perfil IN ('PACIENTE', 'ADMIN'))
    );

    CREATE TABLE solicitacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      especialidade TEXT NOT NULL,
      data_solicitacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'PENDENTE'
        CHECK (status IN (
          'PENDENTE',
          'AGENDADA',
          'CONCLUIDA',
          'CANCELADA'
        )),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  return bancoTeste;
}

// Teste 11 — Usuário inexistente
test('Deve rejeitar solicitacao com usuario inexistente', () => {
  const bancoTeste = criarBancoSolicitacoesTeste();

  try {
    assert.throws(() => {
      bancoTeste.prepare(`
        INSERT INTO solicitacoes (usuario_id, especialidade)
        VALUES (?, ?)
      `).run(999999, 'Cardiologia');
    }, /FOREIGN KEY constraint failed/);
  } finally {
    bancoTeste.close();
  }
});

// Teste 12 — Especialidade obrigatória
test('Deve rejeitar solicitacao sem especialidade', () => {
  const bancoTeste = criarBancoSolicitacoesTeste();

  try {
    assert.throws(() => {
      bancoTeste.prepare(`
        INSERT INTO solicitacoes (usuario_id, especialidade)
        VALUES (?, ?)
      `).run(1, null);
    }, /NOT NULL constraint failed/);
  } finally {
    bancoTeste.close();
  }
});

// Teste 13 — Usuário obrigatório
test('Deve rejeitar solicitacao sem usuario', () => {
  const bancoTeste = criarBancoSolicitacoesTeste();

  try {
    assert.throws(() => {
      bancoTeste.prepare(`
        INSERT INTO solicitacoes (usuario_id, especialidade)
        VALUES (?, ?)
      `).run(null, 'Cardiologia');
    }, /NOT NULL constraint failed/);
  } finally {
    bancoTeste.close();
  }
});

// Teste 14 — Status inválido
test('Deve rejeitar solicitacao com status invalido', () => {
  const bancoTeste = criarBancoSolicitacoesTeste();

  try {
    bancoTeste.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil)
      VALUES (?, ?, ?, ?)
    `).run('Usuario Teste', 'teste@exemplo.com', 'hash_teste', 'PACIENTE');

    assert.throws(() => {
      bancoTeste.prepare(`
        INSERT INTO solicitacoes (usuario_id, especialidade, status)
        VALUES (?, ?, ?)
      `).run(1, 'Cardiologia', 'INVALIDO');
    }, /CHECK constraint failed/);
  } finally {
    bancoTeste.close();
  }
});

// Teste 15 — Status padrão
test('Deve definir status PENDENTE automaticamente', () => {
  const bancoTeste = criarBancoSolicitacoesTeste();

  try {
    const usuario = bancoTeste.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil)
      VALUES (?, ?, ?, ?)
    `).run('Usuario Teste', 'teste@exemplo.com', 'hash_teste', 'PACIENTE');

    const solicitacao = bancoTeste.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(usuario.lastInsertRowid, 'Cardiologia');

    const resultado = bancoTeste.prepare(`
      SELECT status FROM solicitacoes WHERE id = ?
    `).get(solicitacao.lastInsertRowid);

    assert.equal(resultado.status, 'PENDENTE');
  } finally {
    bancoTeste.close();
  }
});