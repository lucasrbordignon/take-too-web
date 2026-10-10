import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { videosService } from '../services/videos.service.ts'
import type { VideoUploadCreateDTO } from '../api/types.ts'

export const VIDEOS_QUERY_KEY = ['videos'] as const

export function useVideos(pagina: number) {
  return useQuery({
    queryKey: [...VIDEOS_QUERY_KEY, pagina],
    queryFn: () => videosService.listar(pagina),
  })
}

export function useCriarVideoUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: VideoUploadCreateDTO) => videosService.criarUpload(data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: VIDEOS_QUERY_KEY }),
  })
}

export function useSincronizarVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => videosService.sincronizar(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: VIDEOS_QUERY_KEY }),
  })
}

export function useExcluirVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => videosService.excluir(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: VIDEOS_QUERY_KEY }),
  })
}
