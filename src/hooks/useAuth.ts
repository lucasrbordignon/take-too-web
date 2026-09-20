import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/auth.service.ts'
import type {
  LoginRequestDTO,
  MagicLinkRequestDTO,
  RegisterRequestDTO,
} from '../api/types.ts'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginRequestDTO) => authService.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterRequestDTO) => authService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useMagicLink() {
  return useMutation({
    mutationFn: (data: MagicLinkRequestDTO) => authService.magicLink(data),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    authService.logout()
    queryClient.clear()
  }
}
