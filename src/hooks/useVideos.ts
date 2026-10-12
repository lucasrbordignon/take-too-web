import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { videosService } from '../services/videos.service.ts'
import type { VideoUploadCreateDTO, VideoPageDTO } from '../api/types.ts'

export const VIDEOS_QUERY_KEY = ['videos'] as const

export function useVideos(pagina: number) {
  return useQuery({
    queryKey: [...VIDEOS_QUERY_KEY, pagina],
    queryFn: () => videosService.listar(pagina),
  })
}

export function useCriarVideoUpload(projetoId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: VideoUploadCreateDTO) => projetoId ? videosService.criarUploadNoProjeto(projetoId, data) : videosService.criarUpload(data),
    retry: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: VIDEOS_QUERY_KEY }),
  })
}

export function useSincronizarVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => videosService.sincronizar(id),
    onSuccess: (video) => {
      for (const queryKey of [VIDEOS_QUERY_KEY, ['project-videos']] as const) {
        queryClient.setQueriesData<VideoPageDTO>({ queryKey }, (page) => page ? { ...page, content: page.content.map((item) => item.id === video.id ? video : item) } : page)
      }
    },
  })
}

export function useExcluirVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => videosService.excluir(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: VIDEOS_QUERY_KEY }),
  })
}
