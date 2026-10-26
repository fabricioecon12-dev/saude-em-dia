<script setup>
import { API_URL } from '../../services/apiConfig.js'
import '../../styles/admin-dashboard.css'
import { ref, onMounted, nextTick } from 'vue'
import ReagendamentoConsulta from '../../components/admin/ReagendamentoConsulta.vue'

defineProps({
  usuario: {
    type: Object,
    required: true
  }
})
function formatarDataConsulta(data) {
  if (typeof data !== 'string') return 'Não informada'

  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data)

  if (!correspondencia) return 'Data inválida'

  const [, ano, mes, dia] = correspondencia

  const dataVerificada = new Date(
    Date.UTC(Number(ano), Number(mes) - 1, Number(dia))
  )

  if (
    dataVerificada.getUTCFullYear() !== Number(ano) ||
    dataVerificada.getUTCMonth() + 1 !== Number(mes) ||
    dataVerificada.getUTCDate() !== Number(dia)
  ) {
    return 'Data inválida'
  }

  return `${dia}/${mes}/${ano}`
}
function formatarDataLocal(data) {
  if (!data) return 'Não informada'

  const dataUTC = new Date(data.replace(' ', 'T') + 'Z')

  return dataUTC.toLocaleString('pt-BR', {
    timeZone: 'America/Belem',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
const totalSolicitacoes = ref(0)
const solicitacoesPendentes = ref(0)
const solicitacoesAgendadas = ref(0)
const listaSolicitacoes = ref([])
const solicitacaoSelecionada = ref(null)
const novoStatus = ref('')
const mensagemNotificacao = ref('')
const tipoNotificacao = ref('')
const historicoSolicitacao = ref([])
const historicoCronologico = ref([])
const historicoConsultado = ref(false)
const painelGerenciamento = ref(null)
// Dados do formulario de agendamento medico
const dataAgendamento = ref('')
const horarioAgendamento = ref('')
const unidadeSaudeAgendamento = ref('')

// Controle do envio do agendamento
const salvandoAgendamento = ref(false)

async function mostrarNotificacao(mensagem, tipo) {
  mensagemNotificacao.value = mensagem
  tipoNotificacao.value = tipo
   await nextTick()

   document.querySelector('.notificacao-admin')?.scrollIntoView({
  behavior: 'smooth',
  block: 'center'
})
}

async function selecionarSolicitacao(solicitacao) {
  mensagemNotificacao.value = ''
  solicitacaoSelecionada.value = solicitacao
  novoStatus.value = solicitacao.status

  historicoSolicitacao.value = []
  historicoCronologico.value = []
  historicoConsultado.value = false
    // Limpar os dados do agendamento anterior
  dataAgendamento.value = ''
  horarioAgendamento.value = ''
  unidadeSaudeAgendamento.value = ''

  await nextTick()

  painelGerenciamento.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}
function fecharGerenciamento() {
  solicitacaoSelecionada.value = null
  novoStatus.value = ''
  historicoSolicitacao.value = []
  historicoCronologico.value = []
  historicoConsultado.value = false
    // Limpar os campos do formulario de agendamento
  dataAgendamento.value = ''
  horarioAgendamento.value = ''
  unidadeSaudeAgendamento.value = ''
}

async function consultarHistorico(solicitacao) {
   try {
    const resposta = await fetch(
  `${API_URL}/api/admin/solicitacoes/${solicitacao.id}/historico`,
  {
    method: 'GET',
    credentials: 'include'
  }
)

const dados = await resposta.json()
if (!resposta.ok) {
  throw new Error(dados.mensagem || 'Erro ao consultar histórico.')
}
historicoSolicitacao.value = dados.historico

const eventosStatus = (dados.historico || []).map(registro => ({
  ...registro,
  tipo: 'status',
  chave: `status-${registro.id}`
}))

const eventosReagendamento = (dados.reagendamentos || []).map(registro => ({
  ...registro,
  tipo: 'reagendamento',
  chave: `reagendamento-${registro.id}`
}))

historicoCronologico.value = [
  ...eventosStatus,
  ...eventosReagendamento
].sort((a, b) => {
  const dataA = String(a.data_alteracao || '')
  const dataB = String(b.data_alteracao || '')

  if (dataA !== dataB) {
    return dataB.localeCompare(dataA)
  }

  return b.id - a.id
})
historicoConsultado.value = true
  } catch (erro) {
    await mostrarNotificacao(erro.message || 'Não foi possível consultar o histórico.', 'erro')

  }
}


async function carregarTotalSolicitacoes() {
  try {
    const resposta = await fetch(
      `${API_URL}/api/admin/solicitacoes/resumo`,
      {
        method: 'GET',
        credentials: 'include'
      }

    )

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar o total de solicitações.')
    }

    const dados = await resposta.json()
    totalSolicitacoes.value = dados.totalSolicitacoes
    solicitacoesPendentes.value = dados.solicitacoesPendentes
    solicitacoesAgendadas.value = dados.solicitacoesAgendadas

  } catch (erro) {
    console.error('Erro ao carregar solicitações:', erro.message)
  }
}
async function carregarListaSolicitacoes(propagarErro = false) {
  try {
    const resposta = await fetch(
      `${API_URL}/api/admin/solicitacoes`,
      {
        method: 'GET',
        credentials: 'include'
      }
    )

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar a lista de solicitações.')
    }

    const dados = await resposta.json()
    listaSolicitacoes.value = dados.solicitacoes

  } catch (erro) {
    console.error('Erro ao carregar lista de solicitações:', erro.message)
    if (propagarErro) {
      throw erro
    }
  }
}

async function salvarAlteracaoStatus() {
const idSolicitacao = solicitacaoSelecionada.value?.id

if (!idSolicitacao) {
 mostrarNotificacao('Selecione uma solicitação antes de salvar.', 'erro')
  return
}
if (novoStatus.value === 'AGENDADA') {
  await mostrarNotificacao(
    'Para agendar uma consulta, utilize o formulário de agendamento médico.',
    'erro'
  )
  return
}

if (novoStatus.value === solicitacaoSelecionada.value.status) {
  mostrarNotificacao('A solicitação já possui o status selecionado.', 'erro')
  return
}

try {
const resposta = await fetch(
  `${API_URL}/api/admin/solicitacoes/${idSolicitacao}/status`,
  {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: novoStatus.value
    })
  }
)

if (resposta.status === 409) {
  throw new Error('A solicitação já possui o status selecionado.')
}

if (!resposta.ok) {
  throw new Error('Não foi possível atualizar o status da solicitação.')
}
await carregarTotalSolicitacoes()
await carregarListaSolicitacoes()

solicitacaoSelecionada.value = null

mostrarNotificacao('Status da solicitação atualizado com sucesso!', 'sucesso')

} catch (erro) {
  mostrarNotificacao('Erro ao salvar alteração: ' + erro.message, 'erro')
}

}
async function concluirReagendamento() {
  try {
    await carregarTotalSolicitacoes()
    await carregarListaSolicitacoes(true)

    fecharGerenciamento()

    await mostrarNotificacao(
      'Consulta médica reagendada com sucesso!',
      'sucesso'
    )
  } catch (erro) {
    await mostrarNotificacao(
      'A consulta foi reagendada, mas houve um problema ao atualizar o painel.',
      'erro'
    )
  }
}
async function salvarAgendamento() {
  const idSolicitacao = solicitacaoSelecionada.value?.id

  if (!idSolicitacao) {
    await mostrarNotificacao(
      'Selecione uma solicitação antes de agendar.',
      'erro'
    )
    return
  }

  if (
    !dataAgendamento.value ||
    !horarioAgendamento.value ||
    !unidadeSaudeAgendamento.value.trim()
  ) {
    await mostrarNotificacao(
      'Preencha a data, o horário e a unidade de saúde.',
      'erro'
    )
    return
  }

  if (salvandoAgendamento.value) {
    return
  }

  salvandoAgendamento.value = true

  try {
    const resposta = await fetch(
      `${API_URL}/api/admin/solicitacoes/${idSolicitacao}/agendamento`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_agendamento: dataAgendamento.value,
          horario: horarioAgendamento.value,
          unidade_saude: unidadeSaudeAgendamento.value.trim()
        })
      }
    )

    const dados = await resposta.json()

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem || 'Não foi possível cadastrar o agendamento.'
      )
    }

    await carregarTotalSolicitacoes()
    await carregarListaSolicitacoes()

    fecharGerenciamento()

    await mostrarNotificacao(
      'Agendamento médico cadastrado com sucesso!',
      'sucesso'
    )

  } catch (erro) {
    await mostrarNotificacao(
      'Erro ao cadastrar agendamento: ' + erro.message,
      'erro'
    )

  } finally {
    salvandoAgendamento.value = false
  }
}

onMounted(() => {
  carregarTotalSolicitacoes()
  carregarListaSolicitacoes()
})

</script>

<template>
  <div class="admin-dashboard">
    <aside class="menu-lateral">
      <h2>Saúde em Dia</h2>
      <p>Painel Administrativo</p>
    </aside>

    <main class="conteudo-admin">
      <header class="cabecalho-admin">
        <div>
          <h1>Visão Geral</h1>
          <p>Acompanhe os indicadores e as solicitações de atendimento.</p>
        </div>

        <div class="perfil-admin">
          <span>{{ usuario.nome }}</span>
          <small>{{ usuario.perfil }}</small>
        </div>
      </header>

      <div
  v-if="mensagemNotificacao"
  class="notificacao-admin"
  :class="tipoNotificacao"
  role="alert"
>
  {{ mensagemNotificacao }}
</div>

      <section class="resumo-admin">
        <h2>Resumo dos atendimentos</h2>
       <div class="grade-indicadores">

  <div class="cartao-indicador">
  <h3>Total de solicitações</h3>
  <p class="valor-indicador">{{ totalSolicitacoes }}</p>
  <small>Solicitações registradas no sistema</small>
</div>

<div class="cartao-indicador">
  <h3>Solicitações pendentes</h3>
  <p class="valor-indicador">{{ solicitacoesPendentes }}</p>
  <small>Solicitações aguardando agendamento</small>
</div>
<div class="cartao-indicador">
  <h3>Solicitações agendadas</h3>
  <p class="valor-indicador">{{ solicitacoesAgendadas }}</p>
  <small>Solicitações com atendimento agendado</small>
</div>

</div>
      </section>


<section class="gestao-solicitacoes">
  <h2>Gestão de Solicitações</h2>
  <p>Consulte e acompanhe as solicitações de atendimento cadastradas.</p>
<div class="tabela-solicitacoes-container">
  <table class="tabela-solicitacoes">
    <thead>
      <tr>
        <th>ID</th>
        <th>Paciente</th>
        <th>Especialidade</th>
        <th>Data da solicitação</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    </thead>
<tbody>
  <tr
    v-for="solicitacao in listaSolicitacoes"
    :key="solicitacao.id"
  >
    <td>{{ solicitacao.id }}</td>
    <td>{{ solicitacao.paciente }}</td>
    <td>{{ solicitacao.especialidade }}</td>
    <td>
  {{ formatarDataLocal(solicitacao.data_solicitacao) }}
</td>
    <td>
  <span
    class="status-solicitacao"
    :class="solicitacao.status.toLowerCase()"
  >
    {{ solicitacao.status }}
  </span>
</td>
<td>
  <button
  type="button"
  class="botao-gerenciar"
  @click="selecionarSolicitacao(solicitacao)"
>
  Gerenciar
</button>

</td>

  </tr>
<tr v-if="listaSolicitacoes.length === 0">
  <td colspan="6" class="tabela-vazia">
    Nenhuma solicitação de atendimento encontrada.
  </td>
</tr>

</tbody>

  </table>
</div>

<div
  v-if="solicitacaoSelecionada"
  ref="painelGerenciamento"
  class="painel-gerenciamento"
>
  <h3>Gerenciar solicitação</h3>

<button
  type="button"
  class="botao-gerenciar"
  @click="fecharGerenciamento"
>
  Fechar gerenciamento
</button>

  <button
  type="button"
  class="botao-gerenciar"
 @click="historicoConsultado ? historicoConsultado = false : consultarHistorico(solicitacaoSelecionada)"
>
  {{ historicoConsultado ? 'Ocultar histórico' : 'Ver histórico' }}
</button>
<h4 v-if="historicoConsultado">Histórico de alterações</h4>

<ul
  v-if="historicoConsultado && historicoCronologico.length > 0"
  class="lista-historico-admin"
>
  <li
    v-for="registro in historicoCronologico"
    :key="registro.chave"
  >
    <template v-if="registro.tipo === 'status'">
      <strong>Alteração de status</strong>
      <p>{{ registro.status_anterior }} → {{ registro.status_novo }}</p>
    </template>

    <template v-else-if="registro.tipo === 'reagendamento'">
      <strong>Reagendamento de consulta</strong>

      <p>
        <strong>Data:</strong>
        {{ formatarDataConsulta(registro.data_anterior) }} → {{ formatarDataConsulta(registro.data_nova) }}
      </p>

      <p>
        <strong>Horário:</strong>
        {{ registro.horario_anterior }} → {{ registro.horario_novo }}
      </p>

      <p>
        <strong>Unidade:</strong>
        {{ registro.unidade_anterior }} → {{ registro.unidade_nova }}
      </p>
    </template>

    <small>
      Data da alteração:
      {{ formatarDataLocal(registro.data_alteracao) }}
    </small>
  </li>
</ul>

<p v-if="historicoConsultado && historicoCronologico.length === 0">
  Nenhuma alteração registrada.
</p>
  <p>
    <strong>Paciente:</strong>
    {{ solicitacaoSelecionada.paciente }}
  </p>

  <p>
    <strong>Especialidade:</strong>
    {{ solicitacaoSelecionada.especialidade }}
  </p>

  <p>
    <strong>Status atual:</strong>
    {{ solicitacaoSelecionada.status }}
  </p>
<!-- Componente de reagendamento -->
<ReagendamentoConsulta
  v-if="
    solicitacaoSelecionada.status === 'AGENDADA' &&
    Number.isSafeInteger(solicitacaoSelecionada.versao) &&
    solicitacaoSelecionada.versao >= 1
  "
  :key="solicitacaoSelecionada.id"
  :solicitacao="solicitacaoSelecionada"
  @reagendamento-concluido="concluirReagendamento"
/>

<p
  v-else-if="solicitacaoSelecionada.status === 'AGENDADA'"
  role="alert"
>
  Esta solicitação está marcada como agendada, mas não possui
  um agendamento válido registrado. O reagendamento não está
  disponível. Verifique os dados antes de prosseguir.
</p>

<!-- Formulário de agendamento médico -->
<form
  v-if="solicitacaoSelecionada.status === 'PENDENTE'"
  class="formulario-agendamento"
  @submit.prevent="salvarAgendamento"
>
  <h4>Agendar consulta médica</h4>

  <div class="campo-agendamento">
    <label for="data-agendamento">Data da consulta</label>
    <input
      id="data-agendamento"
      v-model="dataAgendamento"
      type="date"
      required
    />
  </div>

  <div class="campo-agendamento">
    <label for="horario-agendamento">Horário da consulta</label>
    <input
      id="horario-agendamento"
      v-model="horarioAgendamento"
      type="time"
      required
    />
  </div>

  <div class="campo-agendamento">
    <label for="unidade-saude-agendamento">Unidade de saúde</label>
    <input
      id="unidade-saude-agendamento"
      v-model="unidadeSaudeAgendamento"
      type="text"
      maxlength="150"
      placeholder="Informe a unidade de saúde"
      required
    />
  </div>

  <button
    type="submit"
    class="botao-salvar-status"
    :disabled="salvandoAgendamento"
  >
    {{ salvandoAgendamento ? 'Salvando agendamento...' : 'Confirmar agendamento' }}
  </button>
</form>

<div class="campo-novo-status">
  <label for="novo-status">
    Novo status da solicitação
  </label>

  <select
    id="novo-status"
    v-model="novoStatus"
  >
    <option value="PENDENTE">Pendente</option>
    <option value="AGENDADA" disabled>
  Agendada — utilize o formulário de agendamento
</option>
    <option value="CONCLUIDA">Concluída</option>
    <option value="CANCELADA">Cancelada</option>
  </select>
</div>
<button
  type="button"
  class="botao-salvar-status"
  @click="salvarAlteracaoStatus"
>
  Salvar alteração
</button>

</div>

</section>

    </main>
  </div>
</template>
