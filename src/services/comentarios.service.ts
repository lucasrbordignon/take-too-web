import { apiClient } from '../api/client.ts'
import type { ComentarioCreateDTO, ComentarioDTO } from '../api/types.ts'

export const comentariosService = {
  async listar(versaoId: string): Promise<ComentarioDTO[]> {
    const response = await apiClient.get<ComentarioDTO[]>(`/api/versoes/${versaoId}/comentarios`)
    return response.data
  },

  async criar(versaoId: string, data: ComentarioCreateDTO): Promise<ComentarioDTO> {
    const response = await apiClient.post<ComentarioDTO>(`/api/versoes/${versaoId}/comentarios`, data)
    return response.data
  },
}
