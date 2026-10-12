import { describe, expect, it } from 'vitest'
import { ordenarVersoesRecentes, versaoMaisRecente } from './versoes.ts'

describe('histórico de versões', () => {
  it('ordena numericamente da V10 até a V1 sem modificar os dados recebidos', () => {
    const versions = [{ id: 'v1', numero: 1 }, { id: 'v10', numero: 10 }, { id: 'v2', numero: 2 }]
    expect(ordenarVersoesRecentes(versions).map((version) => version.numero)).toEqual([10, 2, 1])
    expect(versions.map((version) => version.numero)).toEqual([1, 10, 2])
  })
  it('seleciona sempre a mais recente, independentemente da ordem da API', () => {
    expect(versaoMaisRecente([{ numero: 3 }, { numero: 1 }, { numero: 2 }])?.numero).toBe(3)
    expect(versaoMaisRecente([{ numero: 1 }, { numero: 2 }, { numero: 3 }])?.numero).toBe(3)
    expect(versaoMaisRecente([])).toBeNull()
    expect(versaoMaisRecente(undefined)).toBeNull()
  })
})
