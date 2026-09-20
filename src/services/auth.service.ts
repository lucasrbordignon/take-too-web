import { apiClient, removeStoredToken, setStoredToken } from '../api/client.ts'
import type {
  LoginRequestDTO,
  MagicLinkRequestDTO,
  RegisterRequestDTO,
  TokenResponseDTO,
} from '../api/types.ts'

export const authService = {
  async login(data: LoginRequestDTO): Promise<TokenResponseDTO> {
    const response = await apiClient.post<TokenResponseDTO>('/api/auth/login', data)
    if (response.data.token) {
      setStoredToken(response.data.token, response.data.refreshToken)
    }
    return response.data
  },

  async register(data: RegisterRequestDTO): Promise<TokenResponseDTO> {
    const response = await apiClient.post<TokenResponseDTO>('/api/auth/register', data)
    if (response.data.token) {
      setStoredToken(response.data.token, response.data.refreshToken)
    }
    return response.data
  },

  async magicLink(data: MagicLinkRequestDTO): Promise<TokenResponseDTO> {
    const response = await apiClient.post<TokenResponseDTO>('/api/auth/magic-link', data)
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout')
    } catch {
      // Silencia erro se a sessão já estiver revogada/expirada
    } finally {
      removeStoredToken()
    }
  },
}
