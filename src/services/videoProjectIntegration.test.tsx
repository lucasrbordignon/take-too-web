import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NovaVersaoModal } from '../components/NovaVersaoModal.tsx'
import { renderToStaticMarkup } from 'react-dom/server'
import { apiClient } from '../api/client.ts'
import { videosService } from './videos.service.ts'
import { versoesService } from './versoes.service.ts'
import { portalService } from './portal.service.ts'
import { VersionVideoPlayer } from '../components/VersionVideoPlayer.tsx'

vi.mock('../api/client.ts', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(apiClient.post).mockResolvedValue({ data: {} })
  vi.mocked(apiClient.get).mockResolvedValue({ data: { content: [] } })
})

describe('contratos de vídeo no projeto', () => {
  it('envia upload em rascunho sem publicar versão', async () => {
    const body = { nome: 'Corte', origem: 'http://localhost:5174' }
    await videosService.criarUploadNoProjeto('projeto', body)
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/api/projetos/projeto/videos/uploads', body)
  })

  it('publica referência do vídeo sem copiar URL assinada para a versão', async () => {
    await versoesService.criar('projeto', { videoId: 'video' })
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/api/projetos/projeto/versoes', { videoId: 'video' })
  })

  it('mantém publicação por URL legada', async () => {
    await versoesService.criar('projeto', { arquivoUrl: 'https://example.test/video.mp4' })
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/api/projetos/projeto/versoes', { arquivoUrl: 'https://example.test/video.mp4' })
  })

  it('cliente solicita playback pelo portal e nunca pela biblioteca do profissional', async () => {
    await portalService.criarPlayback('versao')
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/api/portal/versoes/versao/playback')
  })

  it('profissional solicita playback no contexto do projeto e da versão', async () => {
    await versoesService.criarPlayback('projeto', 'versao')
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/api/projetos/projeto/versoes/versao/playback')
  })

  it('não repete criação de upload automaticamente após falha de rede', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('network'))
    await expect(videosService.criarUploadNoProjeto('projeto', { nome: 'Corte', origem: 'http://localhost:5174' })).rejects.toThrow('network')
    expect(apiClient.post).toHaveBeenCalledTimes(1)
  })

  it('renderiza vídeo próprio vertical sem iframe legado e preserva o enquadramento', () => {
    const markup = renderToStaticMarkup(<VersionVideoPlayer portal versao={{ id: 'versao', videoId: 'video', arquivoUrl: null,
      tipoMidia: 'VIDEO', video: { id: 'video', status: 'PRONTO', largura: 1080, altura: 1920, duracaoSegundos: 12, proporcao: '9:16', orientacao: 'VERTICAL' } }}
      currentTime={0} totalDuration={12} onTimeUpdate={() => undefined} onDurationChange={() => undefined} />)
    expect(markup).toContain('aspect-ratio:1080/1920')
    expect(markup).toContain('object-contain')
    expect(markup).not.toContain('<iframe')
    expect(apiClient.post).not.toHaveBeenCalled()
  })
})


describe('modal único de publicação', () => {
  it('oferece arquivo no próprio modal e biblioteca, sem link externo ou formulário aninhado', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const markup = renderToStaticMarkup(<QueryClientProvider client={client}><NovaVersaoModal isOpen projetoId="projeto" onClose={() => undefined} /></QueryClientProvider>)
    expect(markup.match(/role="dialog"/g)).toHaveLength(1)
    expect(markup.match(/<form/g)).toHaveLength(1)
    expect(markup).toContain('type="file"')
    expect(markup.match(/role="tab"/g)).toHaveLength(2)
    expect(markup).toContain('role="tabpanel"')
    expect(markup).toContain('Biblioteca')
    expect(markup).not.toContain('Link externo')
    expect(markup).not.toContain('type="url"')
    expect(apiClient.post).not.toHaveBeenCalled()
    client.clear()
  })
})
