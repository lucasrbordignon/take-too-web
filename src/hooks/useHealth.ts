import { useQuery } from '@tanstack/react-query'
import { healthService } from '../services/health.service.ts'

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: () => healthService.ping(),
    refetchInterval: 15000,
    retry: 1,
  })
}
