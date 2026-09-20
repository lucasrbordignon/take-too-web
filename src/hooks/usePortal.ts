import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { portalService } from '../services/portal.service.ts'
import type { ComentarioCreateDTO, StatusVersaoUpdateDTO } from '../api/types.ts'

export const portalProjetoQueryKey = (projetoId?: string) => ['portal', 'projeto', projetoId]
export const portalVersoesQueryKey = (projetoId?: string) => ['portal', 'projeto', projetoId, 'versoes']
export const portalComentariosQueryKey = (versaoId?: string) => ['portal', 'versao', versaoId, 'comentarios']

export function usePortalProjeto(projetoId?: string) {
  return useQuery({
    queryKey: portalProjetoQueryKey(projetoId),
    queryFn: () => portalService.buscarProjeto(projetoId!),
    enabled: !!projetoId,
  })
}

export function usePortalVersoes(projetoId?: string) {
  return useQuery({
    queryKey: portalVersoesQueryKey(projetoId),
    queryFn: () => portalService.listarVersoes(projetoId!),
    enabled: !!projetoId,
  })
}

export function usePortalComentarios(versaoId?: string) {
  return useQuery({
    queryKey: portalComentariosQueryKey(versaoId),
    queryFn: () => portalService.listarComentarios(versaoId!),
    enabled: !!versaoId,
    retry: false,
  })
}

export function usePortalCriarComentario(versaoId?: string, projetoId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ComentarioCreateDTO) => portalService.criarComentario(versaoId!, data),
    onSuccess: () => {
      if (versaoId) {
        queryClient.invalidateQueries({ queryKey: portalComentariosQueryKey(versaoId) })
        queryClient.invalidateQueries({ queryKey: ['versoes', versaoId, 'comentarios'] })
      }
      if (projetoId) {
        queryClient.invalidateQueries({ queryKey: portalVersoesQueryKey(projetoId) })
      }
    },
  })
}

export function usePortalAlterarStatusVersao(versaoId?: string, projetoId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StatusVersaoUpdateDTO) => portalService.alterarStatusVersao(versaoId!, data),
    onSuccess: () => {
      if (projetoId) {
        queryClient.invalidateQueries({ queryKey: portalVersoesQueryKey(projetoId) })
        queryClient.invalidateQueries({ queryKey: portalProjetoQueryKey(projetoId) })
      }
    },
  })
}
