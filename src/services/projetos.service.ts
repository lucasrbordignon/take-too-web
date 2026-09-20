import { apiClient } from '../api/client.ts'
import type {
  AtividadeDTO,
  ProjetoCreateDTO,
  ProjetoDTO,
  StatusProjetoUpdateDTO,
} from '../api/types.ts'

export const projetosService = {
  async listar(): Promise<ProjetoDTO[]> {
    const response = await apiClient.get<ProjetoDTO[]>('/api/projetos')
    return response.data
  },

  async buscarPorId(id: string): Promise<ProjetoDTO> {
    const response = await apiClient.get<ProjetoDTO>(`/api/projetos/${id}`)
    return response.data
  },

  async criar(data: ProjetoCreateDTO): Promise<ProjetoDTO> {
    const response = await apiClient.post<ProjetoDTO>('/api/projetos', data)
    return response.data
  },

  async atualizarStatus(id: string, data: StatusProjetoUpdateDTO): Promise<ProjetoDTO> {
    const response = await apiClient.patch<ProjetoDTO>(`/api/projetos/${id}/status`, data)
    return response.data
  },

  async revogarMagicLink(id: string): Promise<void> {
    await apiClient.post(`/api/projetos/${id}/revogar-link`)
  },

  async listarAtividades(projetoId: string): Promise<AtividadeDTO[]> {
    const response = await apiClient.get<AtividadeDTO[]>(`/api/projetos/${projetoId}/atividades`)
    return response.data
  },
}

