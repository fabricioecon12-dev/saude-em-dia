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