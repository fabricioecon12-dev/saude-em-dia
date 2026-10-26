const db = require('./config/database');
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('PACIENTE', 'ADMIN'))
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS solicitacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    especialidade TEXT NOT NULL,
    data_solicitacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'PENDENTE'
      CHECK (status IN ('PENDENTE', 'AGENDADA', 'CONCLUIDA', 'CANCELADA')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS historico_solicitacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao_id INTEGER NOT NULL,
  status_anterior TEXT NOT NULL,
  status_novo TEXT NOT NULL,
  data_alteracao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    solicitacao_id INTEGER NOT NULL UNIQUE,
    data_agendamento TEXT NOT NULL,
    horario TEXT NOT NULL,
    unidade_saude TEXT NOT NULL,
    data_criacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id)
  );
`);
