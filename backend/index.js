const express = require('express');
const session = require('express-session');
process.loadEnvFile();

const db = require('./config/database');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(session({
  name: 'saude.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 30 * 60 * 1000
  }
}));
app.use((req, res, next) => {
 const origem = req.headers.origin;
const origensPermitidas = ['http://localhost:5173', 'http://localhost:4173'];
if (origensPermitidas.includes(origem)) {
  res.setHeader('Access-Control-Allow-Origin', origem);
}
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.get('/', (req, res) => {
    res.json({ mensagem: 'API Saúde em Dia funcionando!' });
    });
    app.post('/api/auth/login', (req, res) => { 
      const { email, senha } = req.body;
    if (
  typeof email !== 'string' || !email.trim() ||
  typeof senha !== 'string' || !senha.trim()
) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'E-mail e senha são obrigatórios.'
  });
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Digite um endereço de e-mail válido.'
  });
}
const usuario = db.prepare(
  'SELECT id, nome, email, senha_hash, perfil FROM usuarios WHERE email = ?'
).get(email.trim());
const senhaValida = usuario
  ? bcrypt.compareSync(senha, usuario.senha_hash)
  : false;

  if (!senhaValida) {
  return res.status(401).json({
    sucesso: false,
    mensagem: 'E-mail ou senha incorretos.'
  });
}

req.session.usuario = {
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  perfil: usuario.perfil
};

 return res.status(200).json({
  sucesso: true,
  mensagem: 'Login realizado com sucesso.',
  usuario: req.session.usuario
  });

});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Usuário não autenticado.'
    });
  }

return res.status(200).json({
  sucesso: true,
  usuario: req.session.usuario
});

});


app.get('/api/paciente/solicitacoes', (req, res) => {
  const usuario = req.session.usuario

  if (!usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Usuário não autenticado.'
    })
  }

  if (usuario.perfil !== 'PACIENTE') {
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Acesso permitido somente para pacientes.'
    })
  }

  const solicitacoes = db.prepare(`
    SELECT id, especialidade, data_solicitacao, status
    FROM solicitacoes
    WHERE usuario_id = ?
    ORDER BY data_solicitacao DESC, id DESC
  `).all(usuario.id)

  return res.status(200).json({
    sucesso: true,
    solicitacoes
  })
})
app.post('/api/paciente/solicitacoes', (req, res) => {
    const { especialidade } = req.body;
    const usuario = req.session.usuario;
if (!usuario) {
    return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não autenticado.'
    });
}
if (usuario.perfil !== 'PACIENTE') {
    return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso permitido somente para pacientes.'
    });
}
if (typeof especialidade !== 'string' || !especialidade.trim()) {
    return res.status(400).json({
        sucesso: false,
        mensagem: 'Informe uma especialidade médica válida.'
    });
}
const inserirSolicitacao = db.prepare(`
    INSERT INTO solicitacoes (usuario_id, especialidade)
    VALUES (?, ?)
`);
const resultado = inserirSolicitacao.run(
    usuario.id,
    especialidade.trim()
);
return res.status(201).json({
    sucesso: true,
    mensagem: 'Solicitação cadastrada com sucesso.',
    solicitacao_id: resultado.lastInsertRowid
});

});

app.get('/api/admin/solicitacoes/resumo', (req, res) => {
  const usuario = req.session.usuario
  if (!usuario) {
    return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não autenticado.'
    });
}

   if (usuario.perfil !== 'ADMIN') {
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Acesso permitido somente para administradores.'
    })
  }

  const resultado = db.prepare(`
    SELECT COUNT(*) AS total
    FROM solicitacoes
  `).get()

const resultadoPendentes = db.prepare(`
  SELECT COUNT(*) AS total
  FROM solicitacoes
  WHERE status = 'PENDENTE'
`).get()

const resultadoAgendadas = db.prepare(`
  SELECT COUNT(*) AS total
  FROM solicitacoes
  WHERE status = 'AGENDADA'
`).get()

  return res.status(200).json({
  sucesso: true,
  totalSolicitacoes: resultado.total,
  solicitacoesPendentes: resultadoPendentes.total,
  solicitacoesAgendadas: resultadoAgendadas.total
})
})
app.get('/api/admin/solicitacoes', (req, res) => {
  const usuario = req.session.usuario

  if (!usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Usuário não autenticado.'
    })
  }

  if (usuario.perfil !== 'ADMIN') {
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Acesso permitido somente para administradores.'
    })
  }

  try {
    const solicitacoes = db.prepare(`
      SELECT
        s.id,
        u.nome AS paciente,
        s.especialidade,
        s.data_solicitacao,
        s.status
      FROM solicitacoes AS s
      INNER JOIN usuarios AS u
        ON u.id = s.usuario_id
      ORDER BY s.data_solicitacao DESC, s.id DESC
    `).all()

    return res.status(200).json({
      sucesso: true,
      solicitacoes
    })
  } catch (erro) {
    console.error('Erro ao consultar solicitações:', erro.message)

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao consultar solicitações.'
    })
  }
})
app.get('/api/admin/solicitacoes/:id/historico', (req, res) => {
  const usuario = req.session.usuario

  if (!usuario) {
  return res.status(401).json({
    sucesso: false,
    mensagem: 'Usuário não autenticado.'
  })
}
if (usuario.perfil !== 'ADMIN') {
  return res.status(403).json({
    sucesso: false,
    mensagem: 'Acesso permitido somente para administradores.'
  })
}
const idSolicitacao = Number(req.params.id)
if (!Number.isSafeInteger(idSolicitacao) || idSolicitacao <= 0) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'ID da solicitação inválido.'
  })
}
try {
  const historico = db.prepare(`
  SELECT id, solicitacao_id, status_anterior, status_novo, data_alteracao
  FROM historico_solicitacoes
  WHERE solicitacao_id = ?
  ORDER BY data_alteracao DESC, id DESC
`).all(idSolicitacao)
return res.status(200).json({
  sucesso: true,
  solicitacao_id: idSolicitacao,
  historico: historico
})

} catch (erro) {
  console.error('Erro ao consultar histórico:', erro.message)

return res.status(500).json({
  sucesso: false,
  mensagem: 'Erro ao consultar histórico da solicitação.'
})

}

})
app.get('/api/paciente/solicitacoes/:id/historico', (req, res) => {
    
    const usuario = req.session.usuario

  if (!usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Usuário não autenticado.'
    })
  }
    if (usuario.perfil !== 'PACIENTE') {
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Acesso permitido somente a pacientes.'
    })
  }
    const idSolicitacao = Number(req.params.id)

  if (!Number.isSafeInteger(idSolicitacao) || idSolicitacao <= 0) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'ID da solicitação inválido.'
    })
  }
    const solicitacao = db.prepare(`
    SELECT id
    FROM solicitacoes
    WHERE id = ? AND usuario_id = ?
  `).get(idSolicitacao, usuario.id)

  if (!solicitacao) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Solicitação não encontrada.'
    })
  }
  const historico = db.prepare(`
    SELECT
      id,
      solicitacao_id,
      status_anterior,
      status_novo,
      data_alteracao
    FROM historico_solicitacoes
    WHERE solicitacao_id = ?
    ORDER BY data_alteracao DESC, id DESC
  `).all(idSolicitacao)
    return res.status(200).json({
    sucesso: true,
    solicitacao_id: idSolicitacao,
    historico: historico
  })

})

app.patch('/api/admin/solicitacoes/:id/status', (req, res) => {

  const usuario = req.session.usuario

  if (!usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Usuário não autenticado.'
    })
  }

  if (usuario.perfil !== 'ADMIN') {
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Acesso permitido somente para administradores.'
    })
  }
const { status } = req.body || {}

const statusPermitidos = [
  'PENDENTE',
  'AGENDADA',
  'CONCLUIDA',
  'CANCELADA'
]

if (!statusPermitidos.includes(status)) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Status da solicitação inválido.'
  })
}
const idSolicitacao = Number(req.params.id)

if (!Number.isSafeInteger(idSolicitacao) || idSolicitacao <= 0) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'ID da solicitação inválido.'
  })
}
const solicitacaoExistente = db.prepare(`
  SELECT id, status
  FROM solicitacoes
  WHERE id = ?
`).get(idSolicitacao)

if (!solicitacaoExistente) {
  return res.status(404).json({
    sucesso: false,
    mensagem: 'Solicitação não encontrada.'
  })
}
if (solicitacaoExistente.status === status) {
  return res.status(409).json({
    sucesso: false,
    mensagem: 'A solicitação já possui o status informado.'
  })
}
const atualizarComHistorico = db.transaction(() => {
const statusAnterior = solicitacaoExistente.status
const resultado = db.prepare(`
  UPDATE solicitacoes
  SET status = ?
  WHERE id = ?
`).run(status, idSolicitacao)

db.prepare(`
  INSERT INTO historico_solicitacoes
  (solicitacao_id, status_anterior, status_novo)
  VALUES (?, ?, ?)
`).run(idSolicitacao, statusAnterior, status)

})
atualizarComHistorico()
return res.status(200).json({
  sucesso: true,
  mensagem: 'Status da solicitação atualizado com sucesso.',
  solicitacao: {
    id: idSolicitacao,
    status: status
  }
})

})

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((erro) => {
    if (erro) {
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Não foi possível encerrar a sessão.'
      });
    }

    res.clearCookie('saude.sid', { path: '/' });

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Sessão encerrada com sucesso.'
    });
  });
});
    if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Saúde em Dia iniciado na porta ${PORT}`);
  });
}

module.exports = app;