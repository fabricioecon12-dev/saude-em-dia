const db = require('./config/database');
const bcrypt = require('bcrypt');

const administrador = {
  nome: 'Administrador Demonstração',
  email: 'admin@saudeemdia.test',
  perfil: 'ADMIN'
};

const senhaAdministrador = 'Admin@2026Demo!';
const hashAdministrador = bcrypt.hashSync(senhaAdministrador, 12);

const inserirUsuario = db.prepare(`
  INSERT OR IGNORE INTO usuarios (nome, email, senha_hash, perfil)
  VALUES (?, ?, ?, ?)
`);

inserirUsuario.run(
  administrador.nome,
  administrador.email,
  hashAdministrador,
  administrador.perfil
);

const paciente = {
  nome: 'Maria Oliveira',
  email: 'maria@saudeemdia.test',
  perfil: 'PACIENTE'
}

const senhaPaciente = 'Paciente@2026Demo!'
const hashPaciente = bcrypt.hashSync(senhaPaciente, 12)

inserirUsuario.run(
  paciente.nome,
  paciente.email,
  hashPaciente,
  paciente.perfil
)