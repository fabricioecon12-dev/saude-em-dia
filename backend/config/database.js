const Database = require('better-sqlite3');
const path = require('node:path');

const bancoPrincipal = path.join(__dirname, '..', '..', 'database', 'saude-em-dia.sqlite');

const caminhoBanco = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : bancoPrincipal;
const db = new Database(caminhoBanco);

db.pragma('foreign_keys = ON');

module.exports = db;