const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

test('Deve habilitar cookie Secure na configuracao de producao', () => {
  const backend = path.resolve(__dirname, '../../backend');

  const script = `
    const Module = require('node:module');
    const originalLoad = Module._load;
    let configuracao;

    Module._load = function(request, parent, isMain) {
      if (request === 'express-session') {
        return function(opcoes) {
          configuracao = opcoes;
          return function(req, res, next) {
            next();
          };
        };
      }

      return originalLoad.apply(this, arguments);
    };

    require('./index.js');

    if (!configuracao) {
      throw new Error('Middleware de sessao nao encontrado');
    }

    console.log(JSON.stringify({
      secure: configuracao.cookie.secure,
      httpOnly: configuracao.cookie.httpOnly,
      sameSite: configuracao.cookie.sameSite,
      maxAge: configuracao.cookie.maxAge
    }));
  `;

  const resultado = spawnSync(process.execPath, ['-e', script], {
    cwd: backend,
    env: {
      ...process.env,
      NODE_ENV: 'production'
    },
    encoding: 'utf8'
  });

  assert.equal(
    resultado.status,
    0,
    resultado.stderr || 'Falha ao carregar a configuracao'
  );

  const linhas = resultado.stdout.trim().split(/\r?\n/);
  const configuracao = JSON.parse(linhas.at(-1));

  assert.equal(configuracao.secure, true);
  assert.equal(configuracao.httpOnly, true);
  assert.equal(configuracao.sameSite, 'lax');
  assert.equal(configuracao.maxAge, 30 * 60 * 1000);
});
