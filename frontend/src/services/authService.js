import { API_URL } from './apiConfig.js'

export async function realizarLogin(email, senha) {
  try {
    const resposta = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    })

    return await resposta.json()

  } catch (erro) {
    return {
      sucesso: false,
      mensagem: 'Não foi possível conectar ao servidor. Tente novamente.'
    }
  }
}

export async function verificarSessao() {
  try {
    const resposta = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    })

    return await resposta.json()
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: 'Não foi possível verificar a sessão.'
    }
  }
}

export async function encerrarSessao() {
  try {
    const resposta = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })

    return await resposta.json()
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: 'Não foi possível encerrar a sessão. Tente novamente.'
    }
  }
}