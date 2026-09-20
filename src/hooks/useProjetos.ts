import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projetosService } from '../services/projetos.service.ts'
import type { ProjetoCreateDTO, StatusProjetoUpdateDTO } from '../api/types.ts'

export const PROJETOS_QUERY_KEY = ['projetos']

export function useProjetos() {
  return useQuery({
    queryKey: PROJETOS_QUERY_KEY,
    queryFn: () => projetosService.listar(),
  })
}

export function useProjeto(id?: string) {
  return useQuery({
    queryKey: [...PROJETOS_QUERY_KEY, id],
    queryFn: () => projetosService.buscarPorId(id!),
    enabled: !!id,
  })
}

export function useCriarProjeto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProjetoCreateDTO) => projetosService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJETOS_QUERY_KEY })
    },
  })
}

export function useAtualizarStatusProjeto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StatusProjetoUpdateDTO }) =>
      projetosService.atualizarStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJETOS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROJETOS_QUERY_KEY, variables.id] })
    },
  })
}

export function useRevogarMagicLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projetosService.revogarMagicLink(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [...PROJETOS_QUERY_KEY, id] })
    },
  })
}
