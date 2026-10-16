import { apiClient } from '../api/client.ts'
import type { ImagemDTO, ImagemPageDTO, ImagemUploadDTO, ImagemUploadCreateDTO, ImagemVisualizacaoDTO } from '../api/types.ts'
export const imagensService = {
  async listar(projetoId?: string, pagina = 0): Promise<ImagemPageDTO> {
    return (await apiClient.get<ImagemPageDTO>(projetoId ? `/api/projetos/${projetoId}/imagens` : '/api/imagens', { params: { pagina, tamanho: 20 } })).data
  },
  async criarUpload(data: ImagemUploadCreateDTO, projetoId?: string): Promise<ImagemUploadDTO> {
    return (await apiClient.post<ImagemUploadDTO>(projetoId ? `/api/projetos/${projetoId}/imagens/uploads` : '/api/imagens/uploads', data)).data
  },
  async buscarUpload(id: string): Promise<ImagemUploadDTO> { return (await apiClient.get<ImagemUploadDTO>(`/api/imagens/${id}/upload`)).data },
  async confirmar(id: string): Promise<ImagemDTO> { return (await apiClient.post<ImagemDTO>(`/api/imagens/${id}/confirmar`)).data },
  async visualizar(id: string): Promise<ImagemVisualizacaoDTO> { return (await apiClient.post<ImagemVisualizacaoDTO>(`/api/imagens/${id}/visualizacao`)).data },
  async visualizarVersao(versaoId: string, projetoId?: string, portal = false): Promise<ImagemVisualizacaoDTO> {
    return (await apiClient.post<ImagemVisualizacaoDTO>(portal ? `/api/portal/versoes/${versaoId}/imagem` : `/api/projetos/${projetoId}/versoes/${versaoId}/imagem`)).data
  },
  async excluir(id: string): Promise<void> { await apiClient.delete(`/api/imagens/${id}`) },
}
