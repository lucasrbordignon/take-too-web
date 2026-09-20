import { useQuery } from '@tanstack/react-query'
import { projetosService } from '../services/projetos.service.ts'
import type { AtividadeDTO } from '../api/types.ts'

export function useAtividades(projetoId?: string) {
  return useQuery<AtividadeDTO[]>({
    queryKey: ['projetos', projetoId, 'atividades'],
    queryFn: async () => {
      if (!projetoId) return []
      return projetosService.listarAtividades(projetoId)
    },
    enabled: !!projetoId,
  })
}
