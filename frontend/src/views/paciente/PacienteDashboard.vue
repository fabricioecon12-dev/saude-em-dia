<script setup>
import '../../styles/paciente-dashboard.css'
import { ref, onMounted } from 'vue'

defineProps({
  usuario: {
    type: Object,
    required: true
  }
})
const solicitacoes = ref([])
const historicoSolicitacoes = ref({})
const historicoAberto = ref(null)

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
async function carregarSolicitacoes() {
  try {
    const resposta = await fetch(
      'http://localhost:3000/api/paciente/solicitacoes',
      {
        method: 'GET',
        credentials: 'include'
      }
    )

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar as solicitações.')
    }

    const dados = await resposta.json()
    solicitacoes.value = dados.solicitacoes
  } catch (erro) {
    console.error('Erro ao carregar solicitações:', erro.message)
  }
}
async function alternarHistorico(idSolicitacao) {
  if (historicoAberto.value === idSolicitacao) {
    historicoAberto.value = null
  } else {
    historicoAberto.value = idSolicitacao
  }
  try {
    const resposta = await fetch(
  `http://localhost:3000/api/paciente/solicitacoes/${idSolicitacao}/historico`,
  {
    method: 'GET',
    credentials: 'include'
  }
)
if (!resposta.ok) {
  throw new Error('Não foi possível carregar o histórico.')
}
const dados = await resposta.json()
historicoSolicitacoes.value[idSolicitacao] = dados.historico

 } catch (erro) {
  console.error('Erro ao carregar histórico:', erro.message)
  historicoSolicitacoes.value[idSolicitacao] = []
}

}
onMounted(() => {
  carregarSolicitacoes()
})

</script>

<template>
  <div class="painel-paciente">
    <main class="conteudo-paciente">
      <header class="cabecalho-paciente">
        <h1>Meu Painel de Saúde</h1>
        <p>Acompanhe suas solicitações e atendimentos.</p>
      </header>

      <section class="boas-vindas-paciente">
        <h2>Bem-vindo(a), {{ usuario.nome }}!</h2>
        <p>Consulte suas informações de atendimento em um só lugar.</p>
      </section>
      
<section class="solicitacoes-paciente">
  <h2>Minhas Solicitações</h2>
  <p>Acompanhe o andamento das suas solicitações de atendimento.</p>

  <div class="lista-solicitacoes">
  <p v-if="solicitacoes.length === 0">
    Nenhuma solicitação disponível no momento.
  </p>
<div
  v-for="solicitacao in solicitacoes"
  :key="solicitacao.id"
  class="item-solicitacao"
>
  <p><strong>Especialidade:</strong> {{ solicitacao.especialidade }}</p>
  <p><strong>Data da solicitação:</strong> {{ formatarDataLocal(solicitacao.data_solicitacao) }}</p>
  <p>
  <strong>Status:</strong>
  <span :class="['status-badge', 'status-' + solicitacao.status.toLowerCase()]">
    {{ solicitacao.status }}
  </span>
</p>
<button
  class="botao-historico"
  type="button"
  @click="alternarHistorico(solicitacao.id)"
>
  {{ historicoAberto === solicitacao.id ? 'Ocultar histórico' : 'Ver histórico' }}
</button>

<div v-if="historicoAberto === solicitacao.id">
  <h3>Histórico da solicitação</h3>
  <ul v-if="historicoSolicitacoes[solicitacao.id]?.length">
  <li
    v-for="registro in historicoSolicitacoes[solicitacao.id]"
    :key="registro.id"
  >
    {{ registro.status_anterior }} → {{ registro.status_novo }}
    — {{ formatarDataLocal(registro.data_alteracao) }}
  </li>
</ul>
</div>

</div>

</div>
</section>

    </main>
  </div>
</template>
