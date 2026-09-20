import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '../services/clientes.service.ts'
import type { ClienteCreateDTO } from '../api/types.ts'

export const CLIENTES_QUERY_KEY = ['clientes']

export function useClientes() {
  return useQuery({
    queryKey: CLIENTES_QUERY_KEY,
    queryFn: () => clientesService.listar(),
  })
}

export function useCliente(id?: string) {
  return useQuery({
    queryKey: [...CLIENTES_QUERY_KEY, id],
    queryFn: () => clientesService.buscarPorId(id!),
    enabled: !!id,
  })
}

export function useCriarCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ClienteCreateDTO) => clientesService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY })
    },
  })
}
