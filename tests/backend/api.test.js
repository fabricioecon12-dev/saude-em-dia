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