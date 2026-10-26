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
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 60 * 1000
  }
}));
app.use((req, res, next) => {
 const origem = req.headers.origin;
const origensPermitidas = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5174'];
if (origensPermitidas.includes(origem)) {
  res.setHeader('Access-Control-Allow-Origin', origem);
}
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
// Protecao adicional contra requisicoes de origens nao autorizadas
app.use((req, res, next) => {
  const metodosProtegidos = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!metodosProtegidos.includes(req.method)) {
    return next();
  }

  const origem = req.headers.origin;

  const origensPermitidas = [
    'http://localhost:5173',
    'http://localhost:4173', 'http://localhost:5174'
  ];

  if (origem && !origensPermitidas.includes(origem)) {
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Origem da requisicao nao autorizada.'
    });
  }

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

req.session.regenerate((erro) => {
  if (erro) {
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Nao foi possivel iniciar a sessao.'
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
    SELECT
      s.id,
      s.especialidade,
      s.data_solicitacao,
      s.status,
      a.data_agendamento,
      a.horario,
      a.unidade_saude
    FROM solicitacoes AS s
    LEFT JOIN agendamentos AS a
      ON a.solicitacao_id = s.id
    WHERE s.usuario_id = ?
    ORDER BY s.data_solicitacao DESC, s.id DESC
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

// Cadastro de agendamentos pelo administrador
app.post('/api/admin/solicitacoes/:id/agendamento', (req, res) => {

    const usuario = req.session.usuario;

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
    });
  }

    const idSolicitacao = Number(req.params.id);

  if (!Number.isSafeInteger(idSolicitacao) || idSolicitacao <= 0) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'ID da solicitação inválido.'
    });
  }

    const solicitacaoExistente = db.prepare(`
    SELECT id, status
    FROM solicitacoes
    WHERE id = ?
  `).get(idSolicitacao);

  if (!solicitacaoExistente) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Solicitação não encontrada.'
    });
  }

    const agendamentoExistente = db.prepare(`
    SELECT id
    FROM agendamentos
    WHERE solicitacao_id = ?
  `).get(idSolicitacao);

  if (agendamentoExistente) {
    return res.status(409).json({
      sucesso: false,
      mensagem: 'Esta solicitação já possui um agendamento.'
    });
  }

    const {
    data_agendamento,
    horario,
    unidade_saude
  } = req.body || {};

    if (
    typeof data_agendamento !== 'string' ||
    typeof horario !== 'string' ||
    typeof unidade_saude !== 'string' ||
    !data_agendamento.trim() ||
    !horario.trim() ||
    !unidade_saude.trim()
  ) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Data, horário e unidade de saúde são obrigatórios.'
    });
  }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data_agendamento)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'A data do agendamento deve estar no formato AAAA-MM-DD.'
    });
  }

    const dataConvertida = new Date(`${data_agendamento}T00:00:00Z`);

  if (
    Number.isNaN(dataConvertida.getTime()) ||
    dataConvertida.toISOString().slice(0, 10) !== data_agendamento
  ) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'A data do agendamento não existe no calendário.'
    });
  }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O horário deve estar no formato HH:MM, entre 00:00 e 23:59.'
    });
  }

    if (unidade_saude.trim().length > 150) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O nome da unidade de saúde deve ter no máximo 150 caracteres.'
    });
  }

    const agora = new Date();

  const dataAtual = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Belem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(agora);

  if (data_agendamento < dataAtual) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Não é permitido agendar consultas em datas anteriores à atual.'
    });
  }

    const horarioAtual = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Belem',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(agora);

  if (data_agendamento === dataAtual && horario <= horarioAtual) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O horário do agendamento deve ser posterior ao horário atual.'
    });
  }

    if (solicitacaoExistente.status !== 'PENDENTE') {
    return res.status(409).json({
      sucesso: false,
      mensagem: 'Somente solicitações pendentes podem receber um novo agendamento.'
    });
  }

    const cadastrarAgendamento = db.transaction(() => {

          const resultadoAgendamento = db.prepare(`
      INSERT INTO agendamentos (
        solicitacao_id,
        data_agendamento,
        horario,
        unidade_saude
      )
      VALUES (?, ?, ?, ?)
    `).run(
      idSolicitacao,
      data_agendamento,
      horario,
      unidade_saude.trim()
    );

        db.prepare(`
      UPDATE solicitacoes
      SET status = ?
      WHERE id = ?
    `).run('AGENDADA', idSolicitacao);

        db.prepare(`
      INSERT INTO historico_solicitacoes (
        solicitacao_id,
        status_anterior,
        status_novo
      )
      VALUES (?, ?, ?)
    `).run(
      idSolicitacao,
      solicitacaoExistente.status,
      'AGENDADA'
    );

    return Number(resultadoAgendamento.lastInsertRowid);
          });

    const idAgendamento = cadastrarAgendamento();
      return res.status(201).json({
    sucesso: true,
    mensagem: 'Agendamento cadastrado com sucesso.',
    agendamento: {
      id: idAgendamento,
      solicitacao_id: idSolicitacao,
      data_agendamento,
      horario,
      unidade_saude: unidade_saude.trim()
    }
  });
  });

// Reagendamento de consultas pelo administrador
app.patch('/api/admin/solicitacoes/:id/reagendamento', (req, res) => {
  const usuario = req.session.usuario;

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
    });
  }

  if (!/^[1-9]\d*$/.test(req.params.id)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'ID da solicitação inválido.'
    });
  }

  const idSolicitacao = Number(req.params.id);

  if (!Number.isSafeInteger(idSolicitacao)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'ID da solicitação inválido.'
    });
  }

  const {
    data_agendamento,
    horario,
    unidade_saude
  } = req.body || {};

  if (
    typeof data_agendamento !== 'string' ||
    typeof horario !== 'string' ||
    typeof unidade_saude !== 'string' ||
    !data_agendamento.trim() ||
    !horario.trim() ||
    !unidade_saude.trim()
  ) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Data, horário e unidade de saúde são obrigatórios.'
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_agendamento)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'A data do agendamento deve estar no formato AAAA-MM-DD.'
    });
  }

  const dataConvertida = new Date(`${data_agendamento}T00:00:00Z`);

  if (
    Number.isNaN(dataConvertida.getTime()) ||
    dataConvertida.toISOString().slice(0, 10) !== data_agendamento
  ) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'A data do agendamento não existe no calendário.'
    });
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O horário deve estar no formato HH:MM, entre 00:00 e 23:59.'
    });
  }

  const unidadeNormalizada = unidade_saude.trim();

  if (unidadeNormalizada.length > 150) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O nome da unidade de saúde deve ter no máximo 150 caracteres.'
    });
  }

  const agora = new Date();

  const dataAtual = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Belem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(agora);

  const horarioAtual = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Belem',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(agora);

  if (
    data_agendamento < dataAtual ||
    (data_agendamento === dataAtual && horario <= horarioAtual)
  ) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O reagendamento deve ser para uma data e horário futuros.'
    });
  }

  const solicitacao = db.prepare(`
    SELECT id, status
    FROM solicitacoes
    WHERE id = ?
  `).get(idSolicitacao);

  if (!solicitacao) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Solicitação não encontrada.'
    });
  }

  if (solicitacao.status !== 'AGENDADA') {
    return res.status(409).json({
      sucesso: false,
      mensagem: 'Somente solicitações agendadas podem ser reagendadas.'
    });
  }

  const agendamento = db.prepare(`
    SELECT id, data_agendamento, horario, unidade_saude
    FROM agendamentos
    WHERE solicitacao_id = ?
  `).get(idSolicitacao);

  if (!agendamento) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Agendamento não encontrado para esta solicitação.'
    });
  }

  if (
    agendamento.data_agendamento === data_agendamento &&
    agendamento.horario === horario &&
    agendamento.unidade_saude === unidadeNormalizada
  ) {
    return res.status(409).json({
      sucesso: false,
      mensagem: 'Os dados informados são iguais ao agendamento atual.'
    });
  }

  try {
    const reagendar = db.transaction(() => {
      const resultado = db.prepare(`
        UPDATE agendamentos
        SET data_agendamento = ?,
            horario = ?,
            unidade_saude = ?
        WHERE id = ?
      `).run(
        data_agendamento,
        horario,
        unidadeNormalizada,
        agendamento.id
      );

      if (resultado.changes !== 1) {
        throw new Error('Não foi possível atualizar o agendamento.');
      }

      db.prepare(`
        INSERT INTO historico_reagendamentos (
          agendamento_id,
          data_anterior,
          horario_anterior,
          unidade_anterior,
          data_nova,
          horario_novo,
          unidade_nova,
          administrador_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        agendamento.id,
        agendamento.data_agendamento,
        agendamento.horario,
        agendamento.unidade_saude,
        data_agendamento,
        horario,
        unidadeNormalizada,
        usuario.id
      );
    });

    reagendar();

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Consulta reagendada com sucesso.',
      agendamento: {
        id: agendamento.id,
        solicitacao_id: idSolicitacao,
        data_agendamento,
        horario,
        unidade_saude: unidadeNormalizada
      }
    });

  } catch (erro) {
    console.error('Erro ao reagendar consulta:', erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Não foi possível reagendar a consulta.'
    });
  }
});
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