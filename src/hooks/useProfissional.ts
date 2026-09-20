import { useQuery } from '@tanstack/react-query'
import { profissionalService } from '../services/profissional.service.ts'
import { getStoredToken } from '../api/client.ts'

export function useMe() {
  const token = getStoredToken()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => profissionalService.getMe(),
    enabled: !!token,
  })
}
