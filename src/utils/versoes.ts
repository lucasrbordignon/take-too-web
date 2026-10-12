import type { VersaoDTO } from '../api/types.ts'

export function ordenarVersoesRecentes(versoes: readonly VersaoDTO[]): VersaoDTO[] {
  return [...versoes].sort((a, b) => (b.numero ?? 0) - (a.numero ?? 0))
}

export function versaoMaisRecente(versoes: readonly VersaoDTO[] | undefined): VersaoDTO | null {
  return ordenarVersoesRecentes(versoes ?? [])[0] ?? null
}
