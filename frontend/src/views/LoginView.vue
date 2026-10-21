<script setup>
import { ref, onMounted } from 'vue'
import '../styles/login.css'
import { realizarLogin as autenticarUsuario, verificarSessao, encerrarSessao } from '../services/authService.js'
import AdminDashboard from './admin/AdminDashboard.vue'
import PacienteDashboard from './paciente/PacienteDashboard.vue'

const email = ref('')
const senha = ref('')
const mensagem = ref('')
const tipoMensagem = ref('erro')
const usuarioLogado = ref(null)


async function realizarLogin() {
  tipoMensagem.value = 'erro'

  if (email.value.trim() === '' || senha.value === '') {
    mensagem.value = 'Preencha o e-mail e a senha para continuar.'
    return
  }
  
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
  mensagem.value = 'Digite um endereço de e-mail válido.'
  return
}

  
const resposta = await autenticarUsuario(email.value.trim(), senha.value)

tipoMensagem.value = resposta.sucesso ? 'informacao' : 'erro'
mensagem.value = resposta.mensagem

if (resposta.sucesso) {
  const sessao = await verificarSessao()

  if (sessao.sucesso) {
    usuarioLogado.value = sessao.usuario
  }
}

}

async function sairDoSistema() {
  const resposta = await encerrarSessao()

  if (resposta.sucesso) {
    usuarioLogado.value = null
    email.value = ''
    senha.value = ''
    mensagem.value = ''
  } else {
    tipoMensagem.value = 'erro'
    mensagem.value = resposta.mensagem
  }
}
onMounted(async () => {
  try {
    const sessao = await verificarSessao()

    if (sessao.sucesso) {
      usuarioLogado.value = sessao.usuario
    }
  } catch (erro) {
    console.error('Erro ao verificar sessão:', erro)
  }
})

</script>


<template>

<section v-if="usuarioLogado">
  <AdminDashboard
    v-if="usuarioLogado.perfil === 'ADMIN'"
    :usuario="usuarioLogado"
  />

  <PacienteDashboard
  v-else
  :usuario="usuarioLogado"
/>

  <button type="button" @click="sairDoSistema">
    Sair
  </button>
</section>

  <main v-if="!usuarioLogado" class="pagina-login">
    <section class="cartao-login">
      <h1>Bem-vindo ao Saúde em Dia</h1>
      <p>Acesse sua conta para acompanhar seus agendamentos.</p>
        <form @submit.prevent="realizarLogin" novalidate>
            
<div class="campo-formulario">
  <label for="email">E-mail</label>
  <input
    v-model="email"
    id="email"
    type="email"
    placeholder="Digite seu e-mail"
    autocomplete="username"
    required
  />
</div>

<div class="campo-formulario">
  <label for="senha">Senha</label>
  <input
    v-model="senha"
    id="senha"
    type="password"
    placeholder="Digite sua senha"
    autocomplete="current-password"
    required
  />
</div>

<button  type="submit" class="botao-entrar">
  Entrar
</button>

<p
  v-if="mensagem"
  class="mensagem-login"
  :class="tipoMensagem"
  role="status"
>
  {{ mensagem }}
</p>


<p class="aviso-login">
  Ambiente acadêmico demonstrativo — dados fictícios.
</p>

</form>


    </section>
  </main>
</template>
