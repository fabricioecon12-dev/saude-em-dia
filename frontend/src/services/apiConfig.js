const enderecoConfigurado = import.meta.env.VITE_API_URL

export const API_URL = (
  enderecoConfigurado || 'http://localhost:3000'
).replace(/\/+$/, '')