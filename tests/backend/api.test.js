const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../../backend/index');

let servidor;
let urlBase;

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