import { apiClient } from '../api/client.ts'
import type {
  ComentarioCreateDTO,
  ComentarioDTO,
  ProjetoDTO,
  StatusVersaoUpdateDTO,
  VersaoDTO,
  VideoPlaybackDTO,
} from '../api/types.ts'

export const portalService = {
  async criarPlayback(versaoId: string): Promise<VideoPlaybackDTO> {
    return (await apiClient.post<VideoPlaybackDTO>(`/api/portal/versoes/${versaoId}/playback`)).data
  },

  async buscarProjeto(projetoId: string): Promise<ProjetoDTO> {
    const response = await apiClient.get<ProjetoDTO>(`/api/portal/projetos/${projetoId}`)
    return response.data
  },

  async listarVersoes(projetoId: string): Promise<VersaoDTO[]> {
    const response = await apiClient.get<VersaoDTO[]>(`/api/portal/projetos/${projetoId}/versoes`)
    return response.data
  },

  async listarComentarios(versaoId: string): Promise<ComentarioDTO[]> {
    const response = await apiClient.get<ComentarioDTO[]>(`/api/portal/versoes/${versaoId}/comentarios`)
    return response.data
  },

  async criarComentario(versaoId: string, data: ComentarioCreateDTO): Promise<ComentarioDTO> {
    const response = await apiClient.post<ComentarioDTO>(`/api/portal/versoes/${versaoId}/comentarios`, data)
    return response.data
  },

  async alterarStatusVersao(versaoId: string, data: StatusVersaoUpdateDTO): Promise<void> {
    await apiClient.patch(`/api/portal/versoes/${versaoId}/status`, data)
  },
}
