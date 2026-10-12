import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { versoesService } from '../services/versoes.service.ts'
import type { VersaoCreateDTO } from '../api/types.ts'

export const versoesQueryKey = (projetoId?: string) => ['projetos', projetoId, 'versoes']

export function useVersoes(projetoId?: string) {
  return useQuery({
    queryKey: versoesQueryKey(projetoId),
    queryFn: () => versoesService.listar(projetoId!),
    enabled: !!projetoId,
  })
}

export function useCriarVersao(projetoId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: VersaoCreateDTO) => versoesService.criar(projetoId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
      queryClient.invalidateQueries({ queryKey: versoesQueryKey(projetoId) })
      queryClient.invalidateQueries({ queryKey: ['project-videos', projetoId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
