import { apiClient } from '../api/client.ts'
import type { DashboardMetricasDTO } from '../api/types.ts'

export const dashboardService = {
  async obterMetricas(): Promise<DashboardMetricasDTO> {
    const response = await apiClient.get<DashboardMetricasDTO>('/api/dashboard/metricas')
    return response.data
  },
}
