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