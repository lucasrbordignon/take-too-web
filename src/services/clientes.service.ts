import { apiClient } from '../api/client.ts'
import type { ClienteCreateDTO, ClienteDTO } from '../api/types.ts'

export const clientesService = {
  async listar(): Promise<ClienteDTO[]> {
    const response = await apiClient.get<ClienteDTO[]>('/api/clientes')
    return response.data
  },

  async buscarPorId(id: string): Promise<ClienteDTO> {
    const response = await apiClient.get<ClienteDTO>(`/api/clientes/${id}`)
    return response.data
  },

  async criar(data: ClienteCreateDTO): Promise<ClienteDTO> {
    const response = await apiClient.post<ClienteDTO>('/api/clientes', data)
    return response.data
  },
}
