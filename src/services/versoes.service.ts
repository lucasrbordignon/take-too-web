import { apiClient } from '../api/client.ts'
import type { VersaoCreateDTO, VersaoDTO } from '../api/types.ts'

export const versoesService = {
  async listar(projetoId: string): Promise<VersaoDTO[]> {
    const response = await apiClient.get<VersaoDTO[]>(`/api/projetos/${projetoId}/versoes`)
    return response.data
  },

  async criar(projetoId: string, data: VersaoCreateDTO): Promise<VersaoDTO> {
    const response = await apiClient.post<VersaoDTO>(`/api/projetos/${projetoId}/versoes`, data)
    return response.data
  },
}
