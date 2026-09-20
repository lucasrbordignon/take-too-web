import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard.service.ts'
import type { DashboardMetricasDTO } from '../api/types.ts'

export function useDashboardMetricas() {
  return useQuery<DashboardMetricasDTO>({
    queryKey: ['dashboard', 'metricas'],
    queryFn: () => dashboardService.obterMetricas(),
  })
}
