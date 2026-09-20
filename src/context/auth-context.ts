import { createContext } from 'react'
import type {
  LoginRequestDTO,
  ProfissionalDTO,
  RegisterRequestDTO,
  TokenResponseDTO,
} from '../api/types.ts'

export interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  user: ProfissionalDTO | undefined
  isLoading: boolean
  isLoggingIn: boolean
  isRegistering: boolean
  login: (data: LoginRequestDTO) => Promise<TokenResponseDTO>
  register: (data: RegisterRequestDTO) => Promise<TokenResponseDTO>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
