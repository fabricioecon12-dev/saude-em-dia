const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../../backend/index');
const db = require('../../backend/config/database');
const bcrypt = require('../../backend/node_modules/bcrypt');

let servidor;
let urlBase;

function criarUsuarioTeste(perfil = 'PACIENTE') {
  const email = `teste-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}@exemplo.com`;
  const senha = 'SenhaTeste123!';

  const senhaHash = bcrypt.hashSync(senha, 10);

  const resultado = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `).run('Usuario Teste Automatizado', email, senhaHash, perfil);

  return {
    id: Number(resultado.lastInsertRowid),
    email,
    senha
  };
}

function removerUsuarioTeste(id) {
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
}

function removerSolicitacoesTeste(usuarioId) {
  const solicitacoes = db.prepare(`
    SELECT id
    FROM solicitacoes
    WHERE usuario_id = ?
  `).all(usuarioId);

  for (const solicitacao of solicitacoes) {
    db.prepare(`
      DELETE FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).run(solicitacao.id);
  }

  db.prepare(`
    DELETE FROM solicitacoes
    WHERE usuario_id = ?
  `).run(usuarioId);
}

before(async () => {
  servidor = app.listen(0);

  await new Promise((resolve, reject) => {
    if (servidor.listening) {
      resolve();
    } else {
      servidor.once('listening', resolve);
      servidor.once('error', reject);
    }
  });

  const endereco = servidor.address();
  urlBase = `http://127.0.0.1:${endereco.port}`;
});

after(async () => {
  if (servidor) {
    await new Promise((resolve, reject) => {
      servidor.close((erro) => {
        if (erro) reject(erro);
        else resolve();
      });
    });
  }
});

// Teste 21 — API funcionando
test('Deve responder corretamente na rota principal', async () => {
  const resposta = await fetch(`${urlBase}/`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.mensagem, 'API Saúde em Dia funcionando!');
});

// Teste 22 — Login sem dados
test('Deve rejeitar login sem email e senha', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 23 — Login com email inválido
test('Deve rejeitar login com email invalido', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'email-invalido',
      senha: 'senha_teste'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 24 — Login com senha ausente
test('Deve rejeitar login sem senha', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'teste@exemplo.com'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 25 — Solicitação sem autenticação
test('Deve rejeitar solicitacao sem autenticacao', async () => {
  const resposta = await fetch(`${urlBase}/api/paciente/solicitacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      especialidade: 'Cardiologia'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 26 — Alteração de status sem autenticação
test('Deve rejeitar alteracao de status sem autenticacao', async () => {
  const resposta = await fetch(`${urlBase}/api/admin/solicitacoes/1/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'AGENDADA' })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 27 — Alteração de status com corpo vazio e sem autenticação
test('Deve rejeitar alteracao de status sem autenticacao e sem dados', async () => {
  const resposta = await fetch(`${urlBase}/api/admin/solicitacoes/1/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 28 — Consulta administrativa sem autenticação
test('Deve rejeitar consulta administrativa sem autenticacao', async () => {
  const resposta = await fetch(`${urlBase}/api/admin/solicitacoes`);

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 29 — Consulta do paciente sem autenticação
test('Deve rejeitar consulta de solicitacoes sem autenticacao', async () => {
  const resposta = await fetch(`${urlBase}/api/paciente/solicitacoes`);

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 30 — Histórico administrativo sem autenticação
test('Deve rejeitar consulta de historico administrativo sem autenticacao', async () => {
  const resposta = await fetch(`${urlBase}/api/admin/solicitacoes/1/historico`);

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 31 — Login com e-mail vazio
test('Deve rejeitar login com email vazio', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '',
      senha: 'senha_teste'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 32 — Login com senha vazia
test('Deve rejeitar login com senha vazia', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'teste@exemplo.com',
      senha: ''
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 33 — Login com e-mail de tipo inválido
test('Deve rejeitar login com email numerico', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 12345,
      senha: 'senha_teste'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 34 — Login com senha de tipo inválido
test('Deve rejeitar login com senha numerica', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'teste@exemplo.com',
      senha: 12345
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 35 — Consulta de sessão sem autenticação
test('Deve rejeitar consulta de usuario sem autenticacao', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/me`);

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 36 — Usuário inexistente
test('Deve rejeitar login com usuario inexistente', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'usuario-inexistente-36@exemplo.invalid',
      senha: 'senha-incorreta'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
  assert.equal(dados.mensagem, 'E-mail ou senha incorretos.');
});

// Teste 37 — E-mail com espaços
test('Deve rejeitar login com email contendo apenas espacos', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '   ',
      senha: 'senha_teste'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 38 — Senha com espaços
test('Deve rejeitar login com senha contendo apenas espacos', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'teste@exemplo.com',
      senha: '   '
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 39 — E-mail sem arroba
test('Deve rejeitar login com email sem arroba', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'usuario.exemplo.com',
      senha: 'senha_teste'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 40 — E-mail sem domínio
test('Deve rejeitar login com email sem dominio', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'usuario@',
      senha: 'senha_teste'
    })
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.sucesso, false);
});

// Teste 41 — Resumo administrativo sem autenticação
test('Deve bloquear resumo administrativo sem autenticacao', async () => {
  const resposta = await fetch(
    `${urlBase}/api/admin/solicitacoes/resumo`
  );

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 42 — Histórico do paciente sem autenticação
test('Deve bloquear historico do paciente sem autenticacao', async () => {
  const resposta = await fetch(
    `${urlBase}/api/paciente/solicitacoes/1/historico`
  );

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 43 — Histórico administrativo com ID inválido
test('Deve bloquear historico administrativo com ID invalido sem autenticacao', async () => {
  const resposta = await fetch(
    `${urlBase}/api/admin/solicitacoes/abc/historico`
  );

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 44 — Alteração de status com ID inválido
test('Deve bloquear alteracao de status sem autenticacao', async () => {
  const resposta = await fetch(
    `${urlBase}/api/admin/solicitacoes/abc/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'AGENDADA' })
    }
  );

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 45 — Criação de solicitação com dados válidos,
// mas sem autenticação
test('Deve bloquear criacao de solicitacao sem autenticacao', async () => {
  const resposta = await fetch(
    `${urlBase}/api/paciente/solicitacoes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ especialidade: 'Cardiologia' })
    }
  );

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 46 — Logout sem autenticação
test('Deve permitir logout sem usuario autenticado', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/logout`, {
    method: 'POST'
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.sucesso, true);
  assert.equal(dados.mensagem, 'Sessão encerrada com sucesso.');
});

// Teste 47 — Sessão não autenticada após logout
test('Deve manter usuario nao autenticado apos logout', async () => {
  const logout = await fetch(`${urlBase}/api/auth/logout`, {
    method: 'POST'
  });

  assert.equal(logout.status, 200);

  const resposta = await fetch(`${urlBase}/api/auth/me`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 48 — Logout repetido
test('Deve permitir duas requisicoes consecutivas de logout', async () => {
  const primeira = await fetch(`${urlBase}/api/auth/logout`, {
    method: 'POST'
  });

  const segunda = await fetch(`${urlBase}/api/auth/logout`, {
    method: 'POST'
  });

  assert.equal(primeira.status, 200);
  assert.equal(segunda.status, 200);
});

// Teste 49 — Consulta de sessão sem autenticação
test('Deve informar ausencia de sessao autenticada', async () => {
  const resposta = await fetch(`${urlBase}/api/auth/me`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
  assert.equal(dados.mensagem, 'Usuário não autenticado.');
});

// Teste 50 — Logout não concede acesso administrativo
test('Deve manter rota administrativa protegida apos logout', async () => {
  const logout = await fetch(`${urlBase}/api/auth/logout`, {
    method: 'POST'
  });

  assert.equal(logout.status, 200);

  const resposta = await fetch(
    `${urlBase}/api/admin/solicitacoes/resumo`
  );

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
});

// Teste 51 — Login autenticado com usuário temporário
test('Deve realizar login e receber cookie de sessao', async () => {
  const usuario = criarUsuarioTeste();

  try {
    const resposta = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    const dados = await resposta.json();
    const cookie = resposta.headers.get('set-cookie');

    assert.equal(resposta.status, 200);
    assert.equal(dados.sucesso, true);
    assert.equal(dados.usuario.id, usuario.id);
    assert.equal(dados.usuario.perfil, 'PACIENTE');
    assert.ok(cookie?.includes('saude.sid='));

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 52 — Consultar sessão autenticada
test('Deve identificar o usuario com sessao autenticada', async () => {
  const usuario = criarUsuarioTeste();

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(`${urlBase}/api/auth/me`, {
      headers: {
        Cookie: cookie.split(';')[0]
      }
    });

    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.sucesso, true);
    assert.equal(dados.usuario.id, usuario.id);
    assert.equal(dados.usuario.email, usuario.email);
    assert.equal(dados.usuario.perfil, 'PACIENTE');

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 53 — Logout de usuário autenticado
test('Deve encerrar uma sessao autenticada com sucesso', async () => {
  const usuario = criarUsuarioTeste();

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(`${urlBase}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookie.split(';')[0]
      }
    });

    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.sucesso, true);
    assert.equal(dados.mensagem, 'Sessão encerrada com sucesso.');

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 54 — Impedir acesso após logout autenticado
test('Deve invalidar a sessao apos o logout', async () => {
  const usuario = criarUsuarioTeste();

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const cookieSessao = cookie.split(';')[0];

    const logout = await fetch(`${urlBase}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookieSessao
      }
    });

    assert.equal(logout.status, 200);

    const resposta = await fetch(`${urlBase}/api/auth/me`, {
      headers: {
        Cookie: cookieSessao
      }
    });

    const dados = await resposta.json();

    assert.equal(resposta.status, 401);
    assert.equal(dados.sucesso, false);
    assert.equal(dados.mensagem, 'Usuário não autenticado.');

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 55 — Bloquear acesso administrativo após logout
test('Deve bloquear acesso administrativo apos logout', async () => {
  const usuario = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const cookieSessao = cookie.split(';')[0];

    const acessoAntes = await fetch(
      `${urlBase}/api/admin/solicitacoes/resumo`,
      {
        headers: {
          Cookie: cookieSessao
        }
      }
    );

    assert.equal(acessoAntes.status, 200);

    const logout = await fetch(`${urlBase}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookieSessao
      }
    });

    assert.equal(logout.status, 200);

    const acessoDepois = await fetch(
      `${urlBase}/api/admin/solicitacoes/resumo`,
      {
        headers: {
          Cookie: cookieSessao
        }
      }
    );

    const dados = await acessoDepois.json();

    assert.equal(acessoDepois.status, 401);
    assert.equal(dados.sucesso, false);
    assert.equal(dados.mensagem, 'Usuário não autenticado.');

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 56 — Paciente não pode acessar resumo administrativo
test('Deve impedir paciente de acessar resumo administrativo', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/resumo`,
      {
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Acesso permitido somente para administradores.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 57 — Paciente não pode consultar lista administrativa
test('Deve impedir paciente de consultar lista administrativa', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes`,
      {
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Acesso permitido somente para administradores.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 58 — Paciente não pode alterar status de solicitações
test('Deve impedir paciente de alterar status de solicitacoes', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/1/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Acesso permitido somente para administradores.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 59 — Administrador não pode consultar solicitações como paciente
test('Deve impedir administrador de consultar solicitacoes como paciente', async () => {
  const usuario = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Acesso permitido somente para pacientes.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 60 — Administrador não pode cadastrar solicitações como paciente
test('Deve impedir administrador de cadastrar solicitacoes como paciente', async () => {
  const usuario = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          especialidade: 'Cardiologia'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Acesso permitido somente para pacientes.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 61 — Rejeitar solicitação sem especialidade
test('Deve rejeitar solicitacao sem especialidade de paciente autenticado', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({})
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Informe uma especialidade médica válida.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 62 — Rejeitar especialidade vazia
test('Deve rejeitar especialidade vazia de paciente autenticado', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          especialidade: ''
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Informe uma especialidade médica válida.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 63 — Rejeitar especialidade contendo apenas espaços
test('Deve rejeitar especialidade contendo apenas espacos', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          especialidade: '   '
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Informe uma especialidade médica válida.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 64 — Rejeitar especialidade numérica
test('Deve rejeitar especialidade numerica de paciente autenticado', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          especialidade: 123
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Informe uma especialidade médica válida.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 65 — Rejeitar especialidade booleana
test('Deve rejeitar especialidade booleana de paciente autenticado', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          especialidade: true
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Informe uma especialidade médica válida.'
    );

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 66 — Cadastrar solicitação médica válida
test('Deve cadastrar solicitacao medica de paciente autenticado', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          especialidade: 'Cardiologia'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 201);
    assert.equal(dados.sucesso, true);
    assert.equal(
      dados.mensagem,
      'Solicitação cadastrada com sucesso.'
    );
    assert.ok(Number.isSafeInteger(dados.solicitacao_id));

    const solicitacao = db.prepare(`
      SELECT usuario_id, especialidade, status
      FROM solicitacoes
      WHERE id = ?
    `).get(dados.solicitacao_id);

    assert.ok(solicitacao);
    assert.equal(solicitacao.usuario_id, usuario.id);
    assert.equal(solicitacao.especialidade, 'Cardiologia');
    assert.equal(solicitacao.status, 'PENDENTE');

  } finally {
    removerSolicitacoesTeste(usuario.id);
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 67 — Consultar solicitação cadastrada
test('Deve listar solicitacao cadastrada pelo paciente autenticado', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const criar = await fetch(`${urlBase}/api/paciente/solicitacoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie.split(';')[0]
      },
      body: JSON.stringify({
        especialidade: 'Neurologia'
      })
    });

    assert.equal(criar.status, 201);

    const dadosCriacao = await criar.json();

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.sucesso, true);
    assert.ok(Array.isArray(dados.solicitacoes));

    const solicitacao = dados.solicitacoes.find(
      (item) => item.id === dadosCriacao.solicitacao_id
    );

    assert.ok(solicitacao);
    assert.equal(solicitacao.especialidade, 'Neurologia');
    assert.equal(solicitacao.status, 'PENDENTE');

  } finally {
    removerSolicitacoesTeste(usuario.id);
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 68 — Remover espaços extras da especialidade
test('Deve remover espacos extras da especialidade cadastrada', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          especialidade: '   Ortopedia   '
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 201);
    assert.equal(dados.sucesso, true);

    const solicitacao = db.prepare(`
      SELECT especialidade, status
      FROM solicitacoes
      WHERE id = ?
    `).get(dados.solicitacao_id);

    assert.ok(solicitacao);
    assert.equal(solicitacao.especialidade, 'Ortopedia');
    assert.equal(solicitacao.status, 'PENDENTE');

  } finally {
    removerSolicitacoesTeste(usuario.id);
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 69 — Isolamento das solicitações entre pacientes
test('Nao deve listar solicitacoes pertencentes a outro paciente', async () => {
  const pacienteA = criarUsuarioTeste('PACIENTE');
  const pacienteB = criarUsuarioTeste('PACIENTE');

  try {
    const loginA = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pacienteA.email,
        senha: pacienteA.senha
      })
    });

    assert.equal(loginA.status, 200);

    const cookieA = loginA.headers.get('set-cookie');
    assert.ok(cookieA?.includes('saude.sid='));

    const criacao = await fetch(`${urlBase}/api/paciente/solicitacoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA.split(';')[0]
      },
      body: JSON.stringify({
        especialidade: 'Dermatologia'
      })
    });

    assert.equal(criacao.status, 201);

    const dadosCriacao = await criacao.json();

    const loginB = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pacienteB.email,
        senha: pacienteB.senha
      })
    });

    assert.equal(loginB.status, 200);

    const cookieB = loginB.headers.get('set-cookie');
    assert.ok(cookieB?.includes('saude.sid='));

    const resposta = await fetch(`${urlBase}/api/paciente/solicitacoes`, {
      headers: {
        Cookie: cookieB.split(';')[0]
      }
    });

    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.sucesso, true);
    assert.ok(Array.isArray(dados.solicitacoes));

    const solicitacaoDeOutroPaciente = dados.solicitacoes.find(
      (item) => item.id === dadosCriacao.solicitacao_id
    );

    assert.equal(solicitacaoDeOutroPaciente, undefined);

  } finally {
    removerSolicitacoesTeste(pacienteA.id);
    removerSolicitacoesTeste(pacienteB.id);
    removerUsuarioTeste(pacienteA.id);
    removerUsuarioTeste(pacienteB.id);
  }
});

// Teste 70 — Consultar solicitações de paciente sem registros
test('Deve retornar lista vazia para paciente sem solicitacoes', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: usuario.email,
        senha: usuario.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'GET',
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.sucesso, true);
    assert.ok(Array.isArray(dados.solicitacoes));
    assert.equal(dados.solicitacoes.length, 0);

  } finally {
    removerSolicitacoesTeste(usuario.id);
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 71 — Administrador agenda uma solicitação médica
test('Deve permitir administrador agendar solicitacao medica', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.sucesso, true);
    assert.equal(
      dados.mensagem,
      'Status da solicitação atualizado com sucesso.'
    );
    assert.equal(dados.solicitacao.id, solicitacaoId);
    assert.equal(dados.solicitacao.status, 'AGENDADA');

    const solicitacao = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    assert.equal(solicitacao.status, 'AGENDADA');

    const historico = db.prepare(`
      SELECT status_anterior, status_novo
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).get(solicitacaoId);

    assert.ok(historico);
    assert.equal(historico.status_anterior, 'PENDENTE');
    assert.equal(historico.status_novo, 'AGENDADA');

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 72 — Rejeitar atualização com status inválido
test('Deve rejeitar status invalido informado pelo administrador', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Neurologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'EM_ANALISE'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Status da solicitação inválido.'
    );

    const solicitacao = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    assert.equal(solicitacao.status, 'PENDENTE');

    const historico = db.prepare(`
      SELECT COUNT(*) AS total
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).get(solicitacaoId);

    assert.equal(historico.total, 0);

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 73 — Impedir atualização para o mesmo status
test('Deve rejeitar atualizacao para o mesmo status da solicitacao', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Ortopedia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'PENDENTE'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 409);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'A solicitação já possui o status informado.'
    );

    const solicitacao = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    assert.equal(solicitacao.status, 'PENDENTE');

    const historico = db.prepare(`
      SELECT COUNT(*) AS total
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).get(solicitacaoId);

    assert.equal(historico.total, 0);

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 74 — Rejeitar atualização de solicitação inexistente
test('Deve rejeitar atualizacao de solicitacao inexistente', async () => {
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const maiorId = db.prepare(`
      SELECT COALESCE(MAX(id), 0) AS id
      FROM solicitacoes
    `).get();

    const idInexistente = maiorId.id + 1000;

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/${idInexistente}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 404);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Solicitação não encontrada.'
    );

    const historico = db.prepare(`
      SELECT COUNT(*) AS total
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).get(idInexistente);

    assert.equal(historico.total, 0);

  } finally {
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 75 — Registrar múltiplas alterações de status
test('Deve registrar duas alteracoes consecutivas no historico', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const url = `${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`;

    const headers = {
      'Content-Type': 'application/json',
      Cookie: cookie.split(';')[0]
    };

    const primeiraResposta = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'AGENDADA'
      })
    });

    assert.equal(primeiraResposta.status, 200);

    const segundaResposta = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'CONCLUIDA'
      })
    });

    assert.equal(segundaResposta.status, 200);

    const solicitacao = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    assert.equal(solicitacao.status, 'CONCLUIDA');

    const historico = db.prepare(`
      SELECT status_anterior, status_novo
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
      ORDER BY id ASC
    `).all(solicitacaoId);

    assert.equal(historico.length, 2);

    assert.equal(historico[0].status_anterior, 'PENDENTE');
    assert.equal(historico[0].status_novo, 'AGENDADA');

    assert.equal(historico[1].status_anterior, 'AGENDADA');
    assert.equal(historico[1].status_novo, 'CONCLUIDA');

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 76 — Rejeitar identificador não numérico
test('Deve rejeitar ID nao numerico na atualizacao de status', async () => {
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/abc/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'ID da solicitação inválido.'
    );

  } finally {
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 77 — Rejeitar identificador igual a zero
test('Deve rejeitar ID zero na atualizacao de status', async () => {
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/0/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'ID da solicitação inválido.'
    );

  } finally {
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 78 — Rejeitar identificador negativo
test('Deve rejeitar ID negativo na atualizacao de status', async () => {
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/-1/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'ID da solicitação inválido.'
    );

  } finally {
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 79 — Rejeitar identificador decimal
test('Deve rejeitar ID decimal na atualizacao de status', async () => {
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/1.5/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'ID da solicitação inválido.'
    );

  } finally {
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 80 — Rejeitar identificador acima do limite seguro
test('Deve rejeitar ID acima do limite seguro na atualizacao de status', async () => {
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/9007199254740992/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'ID da solicitação inválido.'
    );

  } finally {
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 81 — Impedir paciente de acessar histórico administrativo
test('Deve impedir paciente de consultar historico administrativo', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/1/historico`,
      {
        method: 'GET',
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Acesso permitido somente para administradores.'
    );

  } finally {
    removerUsuarioTeste(paciente.id);
  }
});

// Teste 82 — Impedir administrador de acessar histórico do paciente
test('Deve impedir administrador de consultar historico pela rota do paciente', async () => {
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes/1/historico`,
      {
        method: 'GET',
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.equal(dados.sucesso, false);
    assert.equal(
  dados.mensagem,
  'Acesso permitido somente a pacientes.'
   );

  } finally {
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 83 — Impedir acesso ao histórico de outro paciente
test('Deve impedir paciente de consultar historico de outro paciente', async () => {
  const pacienteA = criarUsuarioTeste('PACIENTE');
  const pacienteB = criarUsuarioTeste('PACIENTE');

  try {
    // Criar uma solicitação pertencente ao paciente B
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(pacienteB.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    // Autenticar o paciente A
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: pacienteA.email,
        senha: pacienteA.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    // Tentar consultar o histórico da solicitação do paciente B
    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes/${solicitacaoId}/historico`,
      {
        method: 'GET',
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 404);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Solicitação não encontrada.'
    );

  } finally {
    removerSolicitacoesTeste(pacienteB.id);
    removerUsuarioTeste(pacienteA.id);
    removerUsuarioTeste(pacienteB.id);
  }
});

// Teste 84 — Impedir consulta ao histórico sem autenticação
test('Deve impedir consulta ao historico do paciente sem autenticacao', async () => {
  const resposta = await fetch(
    `${urlBase}/api/paciente/solicitacoes/1/historico`,
    {
      method: 'GET'
    }
  );

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
  assert.equal(
    dados.mensagem,
    'Usuário não autenticado.'
  );
});

// Teste 85 — Permitir consulta ao próprio histórico
test('Deve permitir paciente consultar seu proprio historico', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');

  try {
    // Criar uma solicitação para o paciente
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    // Registrar uma alteração no histórico
    db.prepare(`
      INSERT INTO historico_solicitacoes
        (solicitacao_id, status_anterior, status_novo)
      VALUES (?, ?, ?)
    `).run(solicitacaoId, 'PENDENTE', 'AGENDADA');

    // Autenticar o paciente
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    // Consultar o próprio histórico
    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes/${solicitacaoId}/historico`,
      {
        method: 'GET',
        headers: {
          Cookie: cookie.split(';')[0]
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.sucesso, true);

    // Confirmar que o histórico foi retornado
    assert.ok(Array.isArray(dados.historico));
    assert.equal(dados.historico.length, 1);
    assert.equal(dados.historico[0].status_anterior, 'PENDENTE');
    assert.equal(dados.historico[0].status_novo, 'AGENDADA');

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
  }
});

// Teste 86 — Impedir acesso após logout
test('Deve impedir acesso a rota protegida apos logout', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');

  try {
    // Autenticar o paciente
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const cookieSessao = cookie.split(';')[0];

    // Encerrar a sessão
    const logout = await fetch(`${urlBase}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookieSessao
      }
    });

    assert.equal(logout.status, 200);

    // Tentar reutilizar a sessão encerrada
    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'GET',
        headers: {
          Cookie: cookieSessao
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 401);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Usuário não autenticado.'
    );

  } finally {
    removerUsuarioTeste(paciente.id);
  }
});

// Teste 87 — Impedir acesso administrativo após logout
test('Deve impedir acesso administrativo apos logout', async () => {
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    // Autenticar o administrador
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const cookieSessao = cookie.split(';')[0];

    // Encerrar a sessão administrativa
    const logout = await fetch(`${urlBase}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookieSessao
      }
    });

    assert.equal(logout.status, 200);

    // Tentar acessar a área administrativa com a sessão encerrada
    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes`,
      {
        method: 'GET',
        headers: {
          Cookie: cookieSessao
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 401);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Usuário não autenticado.'
    );

  } finally {
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 88 — Impedir acesso com cookie de sessão inválido
test('Deve impedir acesso com cookie de sessao invalido', async () => {
  // Simular um cookie de sessão inválido
  const cookieInvalido = 'saude.sid=sessao-invalida-123456';

  // Tentar acessar uma rota protegida
  const resposta = await fetch(
    `${urlBase}/api/paciente/solicitacoes`,
    {
      method: 'GET',
      headers: {
        Cookie: cookieInvalido
      }
    }
  );

  const dados = await resposta.json();

  assert.equal(resposta.status, 401);
  assert.equal(dados.sucesso, false);
  assert.equal(
    dados.mensagem,
    'Usuário não autenticado.'
  );
});

// Teste 89 — Impedir acesso com cookie de sessão adulterado
test('Deve impedir acesso com cookie de sessao adulterado', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');

  try {
    // Autenticar o paciente
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const cookieSessao = cookie.split(';')[0];

    // Alterar um caractere da assinatura do cookie
    const ultimoCaractere = cookieSessao.slice(-1);
    const substituto = ultimoCaractere === 'a' ? 'b' : 'a';

    const cookieAdulterado =
      cookieSessao.slice(0, -1) + substituto;

    assert.notEqual(cookieAdulterado, cookieSessao);

    // Tentar acessar uma rota protegida
    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'GET',
        headers: {
          Cookie: cookieAdulterado
        }
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 401);
    assert.equal(dados.sucesso, false);
    assert.equal(
      dados.mensagem,
      'Usuário não autenticado.'
    );

  } finally {
    removerUsuarioTeste(paciente.id);
  }
});

// Teste 90 — Impedir reutilização de sessão antiga após novo login
test('Deve manter sessao antiga invalida apos novo login', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');

  try {
    // Primeiro login
    const primeiroLogin = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(primeiroLogin.status, 200);

    const primeiroCookie = primeiroLogin.headers.get('set-cookie');
    assert.ok(primeiroCookie?.includes('saude.sid='));

    const sessaoAntiga = primeiroCookie.split(';')[0];

    // Encerrar a primeira sessão
    const logout = await fetch(`${urlBase}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: sessaoAntiga
      }
    });

    assert.equal(logout.status, 200);

    // Realizar novo login
    const segundoLogin = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(segundoLogin.status, 200);

    const segundoCookie = segundoLogin.headers.get('set-cookie');
    assert.ok(segundoCookie?.includes('saude.sid='));

    const sessaoNova = segundoCookie.split(';')[0];

    // A sessão antiga deve continuar inválida
    const acessoAntigo = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        headers: {
          Cookie: sessaoAntiga
        }
      }
    );

    assert.equal(acessoAntigo.status, 401);

    // A nova sessão deve funcionar
    const acessoNovo = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        headers: {
          Cookie: sessaoNova
        }
      }
    );

    assert.equal(acessoNovo.status, 200);

  } finally {
    removerUsuarioTeste(paciente.id);
  }
});

// Teste 96 — Integrar cadastro do paciente com consulta administrativa
test('Deve exibir ao administrador a solicitacao criada pelo paciente', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    // Autenticar o paciente
    const loginPaciente = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(loginPaciente.status, 200);

    const cookiePaciente = loginPaciente.headers.get('set-cookie');
    assert.ok(cookiePaciente?.includes('saude.sid='));

    // Criar solicitação médica
    const cadastro = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookiePaciente.split(';')[0]
        },
        body: JSON.stringify({
          especialidade: 'Cardiologia'
        })
      }
    );

    assert.equal(cadastro.status, 201);

    // Autenticar o administrador
    const loginAdmin = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(loginAdmin.status, 200);

    const cookieAdmin = loginAdmin.headers.get('set-cookie');
    assert.ok(cookieAdmin?.includes('saude.sid='));

    // Consultar solicitações pela área administrativa
    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes`,
      {
        headers: {
          Cookie: cookieAdmin.split(';')[0]
        }
      }
    );

    assert.equal(resposta.status, 200);

    const dados = await resposta.json();

    // Verificar se a solicitação chegou ao banco de dados
    const solicitacao = db.prepare(`
      SELECT id, usuario_id, especialidade, status
      FROM solicitacoes
      WHERE usuario_id = ?
      ORDER BY id DESC
      LIMIT 1
    `).get(paciente.id);

    assert.ok(solicitacao);
    assert.equal(solicitacao.especialidade, 'Cardiologia');
    assert.equal(solicitacao.status, 'PENDENTE');

    // Confirmar que a consulta administrativa foi bem-sucedida
    assert.equal(dados.sucesso, true);

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 97 — Integrar atualização administrativa com consulta do paciente
test('Deve mostrar ao paciente o status atualizado pelo administrador', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    // Criar solicitação com status inicial PENDENTE
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    // Autenticar o administrador
    const loginAdmin = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(loginAdmin.status, 200);

    const cookieAdmin = loginAdmin.headers.get('set-cookie');
    assert.ok(cookieAdmin?.includes('saude.sid='));

    // Atualizar o status da solicitação
    const atualizacao = await fetch(
      `${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieAdmin.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    assert.equal(atualizacao.status, 200);

    // Autenticar o paciente
    const loginPaciente = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(loginPaciente.status, 200);

    const cookiePaciente = loginPaciente.headers.get('set-cookie');
    assert.ok(cookiePaciente?.includes('saude.sid='));

    // Consultar solicitações do paciente
    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes`,
      {
        headers: {
          Cookie: cookiePaciente.split(';')[0]
        }
      }
    );

    assert.equal(resposta.status, 200);

    const dados = await resposta.json();
    assert.equal(dados.sucesso, true);

    // Confirmar que o status foi atualizado no banco
    const solicitacao = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    assert.ok(solicitacao);
    assert.equal(solicitacao.status, 'AGENDADA');

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 98 — Integrar atualização de status com histórico do paciente
test('Deve permitir ao paciente consultar historico apos atualizacao administrativa', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    // Criar solicitação médica
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    // Autenticar o administrador
    const loginAdmin = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(loginAdmin.status, 200);

    const cookieAdmin = loginAdmin.headers.get('set-cookie');
    assert.ok(cookieAdmin?.includes('saude.sid='));

    // Atualizar status pela API administrativa
    const atualizacao = await fetch(
      `${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieAdmin.split(';')[0]
        },
        body: JSON.stringify({
          status: 'AGENDADA'
        })
      }
    );

    assert.equal(atualizacao.status, 200);

    // Autenticar o paciente
    const loginPaciente = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(loginPaciente.status, 200);

    const cookiePaciente = loginPaciente.headers.get('set-cookie');
    assert.ok(cookiePaciente?.includes('saude.sid='));

    // Consultar histórico pela API do paciente
    const resposta = await fetch(
      `${urlBase}/api/paciente/solicitacoes/${solicitacaoId}/historico`,
      {
        method: 'GET',
        headers: {
          Cookie: cookiePaciente.split(';')[0]
        }
      }
    );

    assert.equal(resposta.status, 200);

    const dados = await resposta.json();

    assert.equal(dados.sucesso, true);
    assert.ok(Array.isArray(dados.historico));
    assert.equal(dados.historico.length, 1);

    assert.equal(
      dados.historico[0].status_anterior,
      'PENDENTE'
    );

    assert.equal(
      dados.historico[0].status_novo,
      'AGENDADA'
    );

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 99 — Impedir alteração de status por paciente
test('Deve impedir paciente de alterar status e preservar os dados', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');

  try {
    // Criar uma solicitação médica
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    // Autenticar o paciente
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    // Tentar alterar o status pela rota administrativa
    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'CONCLUIDA'
        })
      }
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.equal(dados.sucesso, false);

    // Confirmar que o status não foi alterado
    const solicitacao = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    assert.ok(solicitacao);
    assert.equal(solicitacao.status, 'PENDENTE');

    // Confirmar que nenhum histórico foi criado
    const historico = db.prepare(`
      SELECT id
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).all(solicitacaoId);

    assert.equal(historico.length, 0);

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
  }
});

// Teste 100 — Garantir integridade após atualização inválida
test('Deve preservar status e historico apos atualizacao administrativa invalida', async () => {
  const administrador = criarUsuarioTeste('ADMIN');
  const paciente = criarUsuarioTeste('PACIENTE');

  try {
    // Criar solicitação com status inicial PENDENTE
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    // Autenticar o administrador
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    // Registrar quantidade inicial de eventos no histórico
    const historicoInicial = db.prepare(`
      SELECT COUNT(*) AS total
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).get(solicitacaoId);

    // Tentar atualizar para um status não permitido
    const resposta = await fetch(
      `${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({
          status: 'STATUS_INVALIDO'
        })
      }
    );

    assert.equal(resposta.status, 400);

    // Confirmar que o status original foi preservado
    const solicitacao = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    assert.ok(solicitacao);
    assert.equal(solicitacao.status, 'PENDENTE');

    // Confirmar que nenhum evento indevido foi registrado
    const historicoFinal = db.prepare(`
      SELECT COUNT(*) AS total
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
    `).get(solicitacaoId);

    assert.equal(
      historicoFinal.total,
      historicoInicial.total
    );

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 101 — Verificar tentativas consecutivas de login incorreto
test('Deve rejeitar tentativas consecutivas de login com senha incorreta', async () => {
  const usuario = criarUsuarioTeste('PACIENTE');

  try {
    for (let tentativa = 1; tentativa <= 5; tentativa++) {
      const resposta = await fetch(`${urlBase}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: usuario.email,
          senha: 'SenhaIncorreta123!'
        })
      });

      const dados = await resposta.json();

      assert.equal(resposta.status, 401);
      assert.equal(dados.sucesso, false);
      assert.equal(dados.mensagem, 'E-mail ou senha incorretos.');
      assert.equal(resposta.headers.get('set-cookie'), null);
    }

  } finally {
    removerUsuarioTeste(usuario.id);
  }
});

// Teste 102 — Verificar cadastro simultâneo de solicitações
test('Deve registrar corretamente cinco solicitacoes simultaneas', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');

  try {
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: paciente.email,
        senha: paciente.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    const especialidades = [
      'Cardiologia',
      'Neurologia',
      'Dermatologia',
      'Ortopedia',
      'Oftalmologia'
    ];

    // Enviar cinco requisições sem aguardar cada uma individualmente
    const respostas = await Promise.all(
      especialidades.map((especialidade) =>
        fetch(`${urlBase}/api/paciente/solicitacoes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookie.split(';')[0]
          },
          body: JSON.stringify({ especialidade })
        })
      )
    );

    // Confirmar que todas foram cadastradas
    for (const resposta of respostas) {
      assert.equal(resposta.status, 201);
    }

    // Consultar os registros persistidos no banco
    const solicitacoes = db.prepare(`
      SELECT id, especialidade, status
      FROM solicitacoes
      WHERE usuario_id = ?
    `).all(paciente.id);

    assert.equal(solicitacoes.length, 5);

    // Confirmar que não existem identificadores duplicados
    const ids = solicitacoes.map((solicitacao) => solicitacao.id);
    assert.equal(new Set(ids).size, 5);

    // Confirmar que todas as especialidades foram registradas
    for (const especialidade of especialidades) {
      assert.ok(
        solicitacoes.some(
          (solicitacao) => solicitacao.especialidade === especialidade
        )
      );
    }

    // Confirmar o status inicial de todas as solicitações
    for (const solicitacao of solicitacoes) {
      assert.equal(solicitacao.status, 'PENDENTE');
    }

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
  }
});

// Teste 103 — Verificar atualizações concorrentes de status
test('Deve manter consistencia entre status e historico em atualizacoes concorrentes', async () => {
  const paciente = criarUsuarioTeste('PACIENTE');
  const administrador = criarUsuarioTeste('ADMIN');

  try {
    const resultado = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(paciente.id, 'Cardiologia');

    const solicitacaoId = Number(resultado.lastInsertRowid);

    // Autenticar o administrador
    const login = await fetch(`${urlBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: administrador.email,
        senha: administrador.senha
      })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie?.includes('saude.sid='));

    // Enviar duas atualizações simultaneamente
    const respostas = await Promise.all([
      fetch(`${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({ status: 'AGENDADA' })
      }),
      fetch(`${urlBase}/api/admin/solicitacoes/${solicitacaoId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0]
        },
        body: JSON.stringify({ status: 'CONCLUIDA' })
      })
    ]);

    // Ambas as atualizações são válidas no fluxo atual
    assert.deepEqual(
      respostas.map((resposta) => resposta.status).sort(),
      [200, 200]
    );

    const solicitacao = db.prepare(`
      SELECT status
      FROM solicitacoes
      WHERE id = ?
    `).get(solicitacaoId);

    const historico = db.prepare(`
      SELECT id, status_anterior, status_novo
      FROM historico_solicitacoes
      WHERE solicitacao_id = ?
      ORDER BY id ASC
    `).all(solicitacaoId);

    assert.equal(historico.length, 2);

    // Primeira transição parte do estado inicial
    assert.equal(historico[0].status_anterior, 'PENDENTE');

    // Segunda transição deve partir do resultado da primeira
    assert.equal(
      historico[1].status_anterior,
      historico[0].status_novo
    );

    // O estado final deve coincidir com o último histórico
    assert.equal(
      solicitacao.status,
      historico[1].status_novo
    );

  } finally {
    removerSolicitacoesTeste(paciente.id);
    removerUsuarioTeste(paciente.id);
    removerUsuarioTeste(administrador.id);
  }
});

// Teste 105 — Verificar isolamento de dados entre pacientes
test('Deve impedir que pacientes visualizem solicitacoes de outros usuarios', async () => {
  const pacienteA = criarUsuarioTeste('PACIENTE');
  const pacienteB = criarUsuarioTeste('PACIENTE');

  try {
    // Criar solicitações para pacientes diferentes
    const resultadoA = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(pacienteA.id, 'Cardiologia');

    const resultadoB = db.prepare(`
      INSERT INTO solicitacoes (usuario_id, especialidade)
      VALUES (?, ?)
    `).run(pacienteB.id, 'Neurologia');

    const idA = Number(resultadoA.lastInsertRowid);
    const idB = Number(resultadoB.lastInsertRowid);

    // Autenticar os dois pacientes
    async function autenticar(paciente) {
      const resposta = await fetch(`${urlBase}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: paciente.email,
          senha: paciente.senha
        })
      });

      assert.equal(resposta.status, 200);

      const cookie = resposta.headers.get('set-cookie');
      assert.ok(cookie?.includes('saude.sid='));

      return cookie.split(';')[0];
    }

    const cookieA = await autenticar(pacienteA);
    const cookieB = await autenticar(pacienteB);

    // Consultar as solicitações dos dois pacientes
    const [respostaA, respostaB] = await Promise.all([
      fetch(`${urlBase}/api/paciente/solicitacoes`, {
        headers: { Cookie: cookieA }
      }),
      fetch(`${urlBase}/api/paciente/solicitacoes`, {
        headers: { Cookie: cookieB }
      })
    ]);

    assert.equal(respostaA.status, 200);
    assert.equal(respostaB.status, 200);

    const dadosA = await respostaA.json();
    const dadosB = await respostaB.json();

    assert.equal(dadosA.sucesso, true);
    assert.equal(dadosB.sucesso, true);

    assert.ok(Array.isArray(dadosA.solicitacoes));
    assert.ok(Array.isArray(dadosB.solicitacoes));

    // Cada paciente deve encontrar sua própria solicitação
    assert.ok(
      dadosA.solicitacoes.some((solicitacao) => solicitacao.id === idA)
    );

    assert.ok(
      dadosB.solicitacoes.some((solicitacao) => solicitacao.id === idB)
    );

    // Nenhum paciente deve visualizar a solicitação do outro
    assert.ok(
      !dadosA.solicitacoes.some((solicitacao) => solicitacao.id === idB)
    );

    assert.ok(
      !dadosB.solicitacoes.some((solicitacao) => solicitacao.id === idA)
    );

  } finally {
    removerSolicitacoesTeste(pacienteA.id);
    removerSolicitacoesTeste(pacienteB.id);

    removerUsuarioTeste(pacienteA.id);
    removerUsuarioTeste(pacienteB.id);
  }
});