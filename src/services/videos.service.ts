import { apiClient } from '../api/client.ts'
import type {
  VideoDTO,
  VideoPageDTO,
  VideoPlaybackDTO,
  VideoUploadCreateDTO,
  VideoUploadDTO,
} from '../api/types.ts'

export const videosService = {
  async listar(pagina = 0, tamanho = 20): Promise<VideoPageDTO> {
    const response = await apiClient.get<VideoPageDTO>('/api/videos', { params: { pagina, tamanho } })
    return response.data
  },

  async buscar(id: string): Promise<VideoDTO> {
    const response = await apiClient.get<VideoDTO>(`/api/videos/${id}`)
    return response.data
  },

  async criarUpload(data: VideoUploadCreateDTO): Promise<VideoUploadDTO> {
    const response = await apiClient.post<VideoUploadDTO>('/api/videos/uploads', data)
    return response.data
  },

  async buscarUpload(id: string): Promise<VideoUploadDTO> {
    const response = await apiClient.get<VideoUploadDTO>(`/api/videos/${id}/upload`)
    return response.data
  },

  async sincronizar(id: string): Promise<VideoDTO> {
    const response = await apiClient.post<VideoDTO>(`/api/videos/${id}/sincronizar`)
    return response.data
  },

  async criarPlayback(id: string): Promise<VideoPlaybackDTO> {
    const response = await apiClient.post<VideoPlaybackDTO>(`/api/videos/${id}/playback`)
    return response.data
  },

  async excluir(id: string): Promise<void> {
    await apiClient.delete(`/api/videos/${id}`)
  },
}
