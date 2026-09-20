import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

// Se VITE_API_URL estiver definido usa a URL externa; caso contrário, usa vazio para usufruir do proxy do Vite (/api -> localhost:8080) sem bloqueio de CORS
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Permite envio automático do cookie HTTP-Only refreshToken
})

// Chaves de armazenamento
const TOKEN_KEY = 'take_too_token'
const REFRESH_TOKEN_KEY = 'take_too_refresh_token'

export const TOKEN_STORAGE_KEY = TOKEN_KEY
export const CLIENT_TOKEN_STORAGE_KEY = 'take_too_client_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// Funções para gerenciamento do Token do Cliente do Magic Link (ROLE_CLIENTE)
export const setClientToken = (token: string) => {
  sessionStorage.setItem(CLIENT_TOKEN_STORAGE_KEY, token)
  localStorage.setItem(CLIENT_TOKEN_STORAGE_KEY, token)
}

export const getClientToken = () => {
  return (
    sessionStorage.getItem(CLIENT_TOKEN_STORAGE_KEY) ||
    localStorage.getItem(CLIENT_TOKEN_STORAGE_KEY)
  )
}

export const removeClientToken = () => {
  sessionStorage.removeItem(CLIENT_TOKEN_STORAGE_KEY)
  localStorage.removeItem(CLIENT_TOKEN_STORAGE_KEY)
}

// Interceptor de Requisição: Anexa o Bearer token adequado (Profissional vs Cliente do Portal)
apiClient.interceptors.request.use(
  (config) => {
    const isPortalRoute = config.url?.startsWith('/api/portal')
    const token = isPortalRoute ? getClientToken() : getStoredToken()

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Controle de concorrência e fila de requisições pendentes
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token)
    } else {
      promise.reject(error)
    }
  })
  failedQueue = []
}

// Interceptor de Resposta: Renovação silenciosa (Refresh Token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!error.response || !originalRequest) {
      return Promise.reject(error)
    }

    const { status } = error.response
    const url = originalRequest.url || ''

    // Ignora 401 em rotas de auth ou portal do cliente
    const isAuthRoute = url.includes('/api/auth/login') || url.includes('/api/auth/refresh')
    const isPortalRoute = url.startsWith('/api/portal')

    if (status !== 401 || isAuthRoute || isPortalRoute || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Se já estiver atualizando o token, enfileira a requisição
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    try {
      // Tenta renovar o token (o cookie httpOnly é enviado via withCredentials, e o body como fallback)
      const { data } = await axios.post<{ token: string; refreshToken?: string }>(
        `${API_BASE_URL}/api/auth/refresh`,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
        { withCredentials: true }
      )

      const newAccessToken = data.token
      setStoredToken(newAccessToken, data.refreshToken)

      // Atualiza o header da requisição original e reenvia
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      processQueue(null, newAccessToken)

      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      removeStoredToken()

      // Redireciona para o login caso a sessão tenha expirado definitivamente
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?expired=true&returnUrl=${returnUrl}`
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
