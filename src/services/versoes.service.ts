import { apiClient } from '../api/client.ts'
import type { VersaoCreateDTO, VersaoDTO, VideoPlaybackDTO } from '../api/types.ts'

export const versoesService = {
  async criarPlayback(projetoId: string, versaoId: string): Promise<VideoPlaybackDTO> {
    return (await apiClient.post<VideoPlaybackDTO>(`/api/projetos/${projetoId}/versoes/${versaoId}/playback`)).data
  },

  async listar(projetoId: string): Promise<VersaoDTO[]> {
    const response = await apiClient.get<VersaoDTO[]>(`/api/projetos/${projetoId}/versoes`)
    return response.data
  },

  async criar(projetoId: string, data: VersaoCreateDTO): Promise<VersaoDTO> {
    const response = await apiClient.post<VersaoDTO>(`/api/projetos/${projetoId}/versoes`, data)
    return response.data
  },
}
