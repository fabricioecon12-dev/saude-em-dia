const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../../backend/config/database');

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