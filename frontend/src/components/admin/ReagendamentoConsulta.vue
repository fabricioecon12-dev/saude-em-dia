<script setup>
import { API_URL } from '../../services/apiConfig.js'
import { ref } from 'vue'

const props = defineProps({
  solicitacao: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['reagendamento-concluido'])

const dataAgendamento = ref('')
const horario = ref('')
const unidadeSaude = ref('')

const mensagem = ref('')
const tipoMensagem = ref('')
const salvando = ref(false)

function obterDataAtualBelem() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Belem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())

  const valores = Object.fromEntries(
    partes.map(parte => [parte.type, parte.value])
  )

  return `${valores.year}-${valores.month}-${valores.day}`
}

function obterDataMinimaBelem() {
  const hoje = obterDataAtualBelem()
  const [ano, mes, dia] = hoje.split('-').map(Number)

  const amanha = new Date(Date.UTC(ano, mes - 1, dia + 1))

  return amanha.toISOString().slice(0, 10)
}

const dataMinima = ref(obterDataMinimaBelem())
async function confirmarReagendamento() {
  if (salvando.value) return

  mensagem.value = ''
  tipoMensagem.value = ''

  if (
    !dataAgendamento.value ||
    !horario.value ||
    !unidadeSaude.value.trim()
  ) {
    mensagem.value = 'Preencha todos os campos obrigatórios.'
    tipoMensagem.value = 'erro'
    return
  }

  const hojeBelem = obterDataAtualBelem()

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dataAgendamento.value) ||
    dataAgendamento.value <= hojeBelem
  ) {
    mensagem.value = 'Selecione uma data futura para o reagendamento.'
    tipoMensagem.value = 'erro'
    return
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horario.value)) {
    mensagem.value = 'Informe um horário válido no formato HH:MM.'
    tipoMensagem.value = 'erro'
    return
  }

  if (unidadeSaude.value.trim().length > 150) {
    mensagem.value = 'A unidade de saúde deve ter no máximo 150 caracteres.'
    tipoMensagem.value = 'erro'
    return
  }
  const versao = props.solicitacao.versao

  if (!Number.isSafeInteger(versao) || versao < 1) {
    mensagem.value = 'Versão do agendamento inválida. Atualize a página.'
    tipoMensagem.value = 'erro'
    return
  }

  salvando.value = true

  try {
    const resposta = await fetch(
      `${API_URL}/api/admin/solicitacoes/${props.solicitacao.id}/reagendamento`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_agendamento: dataAgendamento.value,
          horario: horario.value,
          unidade_saude: unidadeSaude.value.trim(),
          versao
        })
      }
    )

    const dados = await resposta.json()

    if (resposta.status === 409) {
      mensagem.value =
        dados.mensagem ||
        'O agendamento foi alterado por outro administrador. Atualize os dados.'
      tipoMensagem.value = 'erro'
      return
    }

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem || 'Não foi possível reagendar a consulta.'
      )
    }

    mensagem.value = 'Consulta reagendada com sucesso!'
    tipoMensagem.value = 'sucesso'

    emit('reagendamento-concluido', dados)

  } catch (erro) {
    mensagem.value = 'Erro ao reagendar consulta: ' + erro.message
    tipoMensagem.value = 'erro'

  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <section class="reagendamento-consulta">
    <h4>Reagendar consulta médica</h4>

    <p>
      <strong>Paciente:</strong>
      {{ solicitacao.paciente }}
    </p>

    <p>
      <strong>Especialidade:</strong>
      {{ solicitacao.especialidade }}
    </p>

    <form @submit.prevent="confirmarReagendamento" novalidate>
      <div class="campo-reagendamento">
        <label for="nova-data">Nova data</label>
        <input
          id="nova-data"
          v-model="dataAgendamento"
          type="date"
          :min="dataMinima"
          required
        />
      </div>

      <div class="campo-reagendamento">
        <label for="novo-horario">Novo horário</label>
        <input
          id="novo-horario"
          v-model="horario"
          type="time"
          required
        />
      </div>

      <div class="campo-reagendamento">
        <label for="nova-unidade">Unidade de saúde</label>
        <input
          id="nova-unidade"
          v-model="unidadeSaude"
          type="text"
          maxlength="150"
          required
        />
      </div>

      <button type="submit" class="botao-salvar-status" :disabled="salvando">
        {{ salvando ? 'Salvando...' : 'Confirmar reagendamento' }}
      </button>
    </form>

    <p v-if="mensagem" role="status">
      {{ mensagem }}
    </p>
  </section>
</template>

<style scoped>
.reagendamento-consulta {
  margin-top: 24px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.reagendamento-consulta h4 {
  margin-bottom: 20px;
  color: #10243c;
}

.campo-reagendamento {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.campo-reagendamento label {
  color: #10243c;
  font-size: 14px;
  font-weight: 600;
}

.campo-reagendamento input {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
}

.campo-reagendamento input:focus {
  outline: 2px solid #56d3cc;
  border-color: #147d91;
}
</style>
