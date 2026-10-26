const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const raiz = path.resolve(__dirname, '..');

const bancoPrincipal = path.join(
  raiz,
  'database',
  'saude-em-dia.sqlite'
);

const bancoTeste = path.join(
  raiz,
  'database',
  'saude-em-dia-test.sqlite'
);

if (!fs.existsSync(bancoTeste)) {
  console.error('ERRO: banco exclusivo para testes nao encontrado.');
  process.exit(1);
}

if (path.resolve(bancoTeste) === path.resolve(bancoPrincipal)) {
  console.error('ERRO: o banco de testes nao pode ser o banco principal.');
  process.exit(1);
}

const ambiente = {
  ...process.env,
  DATABASE_PATH: bancoTeste
};

console.log('Executando testes com banco isolado.');
console.log('Banco de testes:', bancoTeste);

const resultado = spawnSync(
  process.execPath,
  [
    '--test',
    path.join(raiz, 'tests', 'backend', 'api.test.js'),
    path.join(raiz, 'tests', 'backend', 'cookie-production.test.js'),
    path.join(raiz, 'tests', 'backend', 'database.test.js')
  ],
  {
    cwd: __dirname,
    env: ambiente,
    stdio: 'inherit'
  }
);

if (resultado.error) {
  console.error('Falha ao iniciar testes:', resultado.error.message);
  process.exit(1);
}

process.exit(resultado.status ?? 1);