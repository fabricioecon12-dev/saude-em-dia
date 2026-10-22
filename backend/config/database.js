const Database = require('better-sqlite3');
const path = require('node:path');

const caminhoBanco = path.join(__dirname, '..', '..', 'database', 'saude-em-dia.sqlite');
const db = new Database(caminhoBanco);

db.pragma('foreign_keys = ON');

module.exports = db;