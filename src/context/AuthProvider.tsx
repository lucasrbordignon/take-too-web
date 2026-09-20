import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getStoredToken, removeStoredToken, setStoredToken } from '../api/client.ts'
import { authService } from '../services/auth.service.ts'
import { useMe } from '../hooks/useProfissional.ts'
import { AuthContext } from './auth-context.ts'
import type {
  LoginRequestDTO,
  RegisterRequestDTO,
  TokenResponseDTO,
} from '../api/types.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const queryClient = useQueryClient()
  const { data: user, isLoading: isUserLoading } = useMe()

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(getStoredToken())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = async (data: LoginRequestDTO): Promise<TokenResponseDTO> => {
    try {
      setIsLoggingIn(true)
      const res = await authService.login(data)
      if (res.token) {
        setStoredToken(res.token)
        setToken(res.token)
        await queryClient.invalidateQueries({ queryKey: ['me'] })
      }
      return res
    } finally {
      setIsLoggingIn(false)
    }
  }

  const register = async (data: RegisterRequestDTO): Promise<TokenResponseDTO> => {
    try {
      setIsRegistering(true)
      const res = await authService.register(data)
      if (res.token) {
        setStoredToken(res.token)
        setToken(res.token)
        await queryClient.invalidateQueries({ queryKey: ['me'] })
      }
      return res
    } finally {
      setIsRegistering(false)
    }
  }

  const logout = () => {
    removeStoredToken()
    setToken(null)
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        user,
        isLoading: !!token && isUserLoading,
        isLoggingIn,
        isRegistering,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
