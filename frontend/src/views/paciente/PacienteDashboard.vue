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
  <p><strong>Data da solicitação:</strong> {{ solicitacao.data_solicitacao }}</p>
  <p>
  <strong>Status:</strong>
  <span :class="['status-badge', 'status-' + solicitacao.status.toLowerCase()]">
    {{ solicitacao.status }}
  </span>
</p>
</div>

</div>
</section>

    </main>
  </div>
</template>
