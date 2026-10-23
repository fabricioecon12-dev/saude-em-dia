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

// Banco temporário para testar o histórico de solicitações
function criarBancoHistoricoTeste() {
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
        CHECK (status IN ('PENDENTE', 'AGENDADA', 'CONCLUIDA', 'CANCELADA')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE historico_solicitacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      solicitacao_id INTEGER NOT NULL,
      status_anterior TEXT NOT NULL,
      status_novo TEXT NOT NULL,
      data_alteracao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id)
    );
  `);

  return bancoTeste;
}

// Teste 16 — Solicitação inexistente
test('Deve rejeitar historico com solicitacao inexistente', () => {
  const bancoTeste = criarBancoHistoricoTeste();

  try {
    assert.throws(() => {
      bancoTeste.prepare(`
        INSERT INTO historico_solicitacoes
          (solicitacao_id, status_anterior, status_novo)
        VALUES (?, ?, ?)
      `).run(999999, 'PENDENTE', 'AGENDADA');
    }, /FOREIGN KEY constraint failed/);
  } finally {
    bancoTeste.close();
  }
});

// Teste 17 — Solicitação obrigatória
test('Deve rejeitar historico sem solicitacao', () => {
  const bancoTeste = criarBancoHistoricoTeste();

  try {
    assert.throws(() => {
      bancoTeste.prepare(`
        INSERT INTO historico_solicitacoes
          (solicitacao_id, status_anterior, status_novo)
        VALUES (?, ?, ?)
      `).run(null, 'PENDENTE', 'AGENDADA');
    }, /NOT NULL constraint failed/);
  } finally {
    bancoTeste.close();
  }
});

// Teste 18 — Status anterior obrigatório
test('Deve rejeitar historico sem status anterior', () => {
  const bancoTeste = criarBancoHistoricoTeste();

  try {
    assert.throws(() => {
      bancoTeste.prepare(`
        INSERT INTO historico_solicitacoes
          (solicitacao_id, status_anterior, status_novo)
        VALUES (?, ?, ?)
      `).run(1, null, 'AGENDADA');
    }, /NOT NULL constraint failed/);
  } finally {
    bancoTeste.close();
  }
});

// Teste 19 — Status novo obrigatório
test('Deve rejeitar historico sem status novo', () => {
  const bancoTeste = criarBancoHistoricoTeste();

  try {
    assert.throws(() => {
      bancoTeste.prepare(`
        INSERT INTO historico_solicitacoes
          (solicitacao_id, status_anterior, status_novo)
        VALUES (?, ?, ?)
      `).run(1, 'PENDENTE', null);
    }, /NOT NULL constraint failed/);
  } finally {
    bancoTeste.close();
  }
});

// Teste 20 — Data automática
test('Deve registrar automaticamente a data do historico', () => {
  const bancoTeste = criarBancoHistoricoTeste();

  try {
    const usuario = bancoTeste.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil)
      VALUES (?, ?, ?, ?)
    `).run('Usuario Teste', 'teste@exemplo.com', 'hash_teste', 'PACIENTE');

    const solicitacao = bancoTeste.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(usuario.lastInsertRowid, 'Cardiologia');

    const historico = bancoTeste.prepare(`
      INSERT INTO historico_solicitacoes
        (solicitacao_id, status_anterior, status_novo)
      VALUES (?, ?, ?)
    `).run(solicitacao.lastInsertRowid, 'PENDENTE', 'AGENDADA');

    const resultado = bancoTeste.prepare(`
      SELECT data_alteracao
      FROM historico_solicitacoes
      WHERE id = ?
    `).get(historico.lastInsertRowid);

    assert.ok(resultado.data_alteracao);
  } finally {
    bancoTeste.close();
  }
});

// Teste 91 — Impedir solicitação vinculada a paciente inexistente
test('Deve impedir solicitacao com paciente inexistente', () => {
  const pacienteInexistente = -999999;

  assert.throws(() => {
    db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(pacienteInexistente, 'Cardiologia');
  }, {
    code: 'SQLITE_CONSTRAINT_FOREIGNKEY'
  });
});

// Teste 92 — Impedir histórico de solicitação inexistente
test('Deve impedir historico de solicitacao inexistente', () => {
  const solicitacaoInexistente = -999999;

  assert.throws(() => {
    db.prepare(`
      INSERT INTO historico_solicitacoes
        (solicitacao_id, status_anterior, status_novo)
      VALUES (?, ?, ?)
    `).run(
      solicitacaoInexistente,
      'PENDENTE',
      'AGENDADA'
    );
  }, {
    code: 'SQLITE_CONSTRAINT_FOREIGNKEY'
  });
});

// Teste 93 — Impedir exclusão de paciente com solicitações
test('Deve impedir exclusao de paciente com solicitacoes vinculadas', () => {
  const email = `integridade-${Date.now()}-${Math.random()}@teste.com`;

  const usuario = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `).run(
    'Paciente Integridade',
    email,
    'hash-teste',
    'PACIENTE'
  );

  const pacienteId = Number(usuario.lastInsertRowid);

  try {
    db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(pacienteId, 'Cardiologia');

    // A exclusão deve ser bloqueada pela chave estrangeira
    assert.throws(() => {
      db.prepare(`
        DELETE FROM usuarios WHERE id = ?
      `).run(pacienteId);
    }, {
      code: 'SQLITE_CONSTRAINT_FOREIGNKEY'
    });

    // Confirmar que o paciente continua cadastrado
    const paciente = db.prepare(`
      SELECT id FROM usuarios WHERE id = ?
    `).get(pacienteId);

    assert.ok(paciente);

  } finally {
    // Limpar os dados criados pelo teste
    db.prepare(`
      DELETE FROM solicitacoes WHERE usuario_id = ?
    `).run(pacienteId);

    db.prepare(`
      DELETE FROM usuarios WHERE id = ?
    `).run(pacienteId);
  }
});

// Teste 94 — Impedir exclusão de solicitação com histórico
test('Deve impedir exclusao de solicitacao com historico vinculado', () => {
  const email = `historico-${Date.now()}-${Math.random()}@teste.com`;

  const usuario = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `).run(
    'Paciente Teste Historico',
    email,
    'hash-teste',
    'PACIENTE'
  );

  const pacienteId = Number(usuario.lastInsertRowid);
  let solicitacaoId;

  try {
    const solicitacao = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(pacienteId, 'Cardiologia');

    solicitacaoId = Number(solicitacao.lastInsertRowid);

    db.prepare(`
      INSERT INTO historico_solicitacoes
        (solicitacao_id, status_anterior, status_novo)
      VALUES (?, ?, ?)
    `).run(solicitacaoId, 'PENDENTE', 'AGENDADA');

    // A exclusão deve ser impedida pela chave estrangeira
    assert.throws(() => {
      db.prepare(`
        DELETE FROM solicitacoes WHERE id = ?
      `).run(solicitacaoId);
    }, {
      code: 'SQLITE_CONSTRAINT_FOREIGNKEY'
    });

    // Confirmar que a solicitação continua cadastrada
    const registro = db.prepare(`
      SELECT id FROM solicitacoes WHERE id = ?
    `).get(solicitacaoId);

    assert.ok(registro);

    // Confirmar que o histórico foi preservado
    const historico = db.prepare(`
      SELECT id
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).all(solicitacaoId);

    assert.equal(historico.length, 1);

  } finally {
    // Remover os dados na ordem correta
    if (solicitacaoId) {
      db.prepare(`
        DELETE FROM historico_solicitacoes
        WHERE solicitacao_id = ?
      `).run(solicitacaoId);

      db.prepare(`
        DELETE FROM solicitacoes WHERE id = ?
      `).run(solicitacaoId);
    }

    db.prepare(`
      DELETE FROM usuarios WHERE id = ?
    `).run(pacienteId);
  }
});

// Teste 95 — Preservar dados após atualização inválida
test('Deve preservar status original apos atualizacao invalida', () => {
  const email = `status-${Date.now()}-${Math.random()}@teste.com`;

  const usuario = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `).run(
    'Paciente Teste Integridade',
    email,
    'hash-teste',
    'PACIENTE'
  );

  const pacienteId = Number(usuario.lastInsertRowid);
  let solicitacaoId;

  try {
    const solicitacao = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(pacienteId, 'Cardiologia');

    solicitacaoId = Number(solicitacao.lastInsertRowid);

    // Tentar atualizar com um status não permitido
    assert.throws(() => {
      db.prepare(`
        UPDATE solicitacoes
        SET status = ?
        WHERE id = ?
      `).run('STATUS_INVALIDO', solicitacaoId);
    }, {
      code: 'SQLITE_CONSTRAINT_CHECK'
    });

    // Verificar se o status original foi preservado
    const registro = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    assert.ok(registro);
    assert.equal(registro.status, 'PENDENTE');

  } finally {
    // Limpar os registros criados pelo teste
    if (solicitacaoId) {
      db.prepare(`
        DELETE FROM solicitacoes
        WHERE id = ?
      `).run(solicitacaoId);
    }

    db.prepare(`
      DELETE FROM usuarios
      WHERE id = ?
    `).run(pacienteId);
  }
});