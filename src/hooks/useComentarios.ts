import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { comentariosService } from '../services/comentarios.service.ts'
import type { ComentarioCreateDTO } from '../api/types.ts'

export const comentariosQueryKey = (versaoId?: string) => ['versoes', versaoId, 'comentarios']

export function useComentarios(versaoId?: string) {
  return useQuery({
    queryKey: comentariosQueryKey(versaoId),
    queryFn: () => comentariosService.listar(versaoId!),
    enabled: !!versaoId,
  })
}

export function useCriarComentario(versaoId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ComentarioCreateDTO) => comentariosService.criar(versaoId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comentariosQueryKey(versaoId) })
    },
  })
}
