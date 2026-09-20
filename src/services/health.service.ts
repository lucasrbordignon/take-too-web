import { apiClient } from '../api/client.ts'

export const healthService = {
  async ping(): Promise<Record<string, string>> {
    const response = await apiClient.get<Record<string, string>>('/api/ping')
    return response.data
  },
}
