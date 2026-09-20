import { apiClient } from '../api/client.ts'
import type { ProfissionalDTO } from '../api/types.ts'

export const profissionalService = {
  async getMe(): Promise<ProfissionalDTO> {
    const response = await apiClient.get<ProfissionalDTO>('/api/profissionais/me')
    return response.data
  },
}
