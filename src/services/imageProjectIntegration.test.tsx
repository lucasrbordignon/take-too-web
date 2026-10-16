import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { apiClient } from '../api/client.ts'
import { imagensService } from './imagens.service.ts'
import { versoesService } from './versoes.service.ts'
import { VersionVideoPlayer } from '../components/VersionVideoPlayer.tsx'
vi.mock('../api/client.ts', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); vi.mocked(apiClient.post).mockResolvedValue({ data: {} }) })
describe('imagens no projeto', () => {
  it('autoriza upload em rascunho e confirma sem publicar automaticamente', async () => {
    const data = { nome: 'Foto', tipo: 'image/png', tamanhoBytes: 100, checksum: 'checksum' }
    await imagensService.criarUpload(data, 'projeto')
    await imagensService.confirmar('imagem')
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/api/projetos/projeto/imagens/uploads', data)
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/api/imagens/imagem/confirmar')
    expect(apiClient.post).toHaveBeenCalledTimes(2)
  })
  it('publica apenas a referência da imagem', async () => {
    await versoesService.criar('projeto', { imagemId: 'imagem' })
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/api/projetos/projeto/versoes', { imagemId: 'imagem' })
  })
  it('autoriza o cliente pela versão do portal, sem acessar a biblioteca', async () => {
    await imagensService.visualizarVersao('versao', undefined, true)
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/api/portal/versoes/versao/imagem')
  })
  it('autoriza o profissional pelo contexto do projeto', async () => {
    await imagensService.visualizarVersao('versao', 'projeto')
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/api/projetos/projeto/versoes/versao/imagem')
  })
  it('renderiza imagem sem carregar player de vídeo ou iframe', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const markup = renderToStaticMarkup(<QueryClientProvider client={client}><VersionVideoPlayer portal versao={{ id: 'versao', imagemId: 'imagem', tipoMidia: 'IMAGEM' }} currentTime={0} totalDuration={0} onTimeUpdate={() => undefined} onDurationChange={() => undefined} /></QueryClientProvider>)
    expect(markup).toContain('Imagem da versão')
    expect(markup).not.toContain('<video'); expect(markup).not.toContain('<iframe')
    client.clear()
  })
})
