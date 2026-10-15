import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Hls from 'hls.js'
import type { ErrorData } from 'hls.js'
import type { VideoPlaybackDTO } from '../api/types.ts'
import { attachHlsPlayback, hlsPlaybackIssue } from './hlsPlayback.ts'

class Media extends EventTarget {
  src = ''
  error: { code: number } | null = null
  canPlayType = vi.fn(() => 'maybe')
  load = vi.fn()
}
class FakeHls {
  static supported = true
  static instances: FakeHls[] = []
  static Events = { ERROR: 'error', MEDIA_ATTACHED: 'attached' }
  static ErrorTypes = { MEDIA_ERROR: 'mediaError' }
  static isSupported() { return this.supported }
  callbacks = new Map<string, (event: string, data: ErrorData) => void>()
  loadSource = vi.fn()
  attachMedia = vi.fn()
  destroy = vi.fn()
  recoverMediaError = vi.fn()
  constructor() { FakeHls.instances.push(this) }
  on(event: string, listener: (event: string, data: ErrorData) => void) { this.callbacks.set(event, listener) }
  emit(event: string, data = {} as ErrorData) { this.callbacks.get(event)?.(event, data) }
}
const session = { url: 'https://stream.example.test/video.m3u8?token=secret', tipo: 'application/vnd.apple.mpegurl' } as VideoPlaybackDTO
const loader = async () => FakeHls as unknown as typeof Hls
const mediaElement = (media: Media) => media as unknown as HTMLVideoElement
const callbacks = () => ({ onReady: vi.fn(), onError: vi.fn() })

beforeEach(() => { FakeHls.instances = []; FakeHls.supported = true })

describe('inicialização e ciclo de vida HLS', () => {
  it('prioriza MSE mesmo quando a reprodução nativa anuncia suporte parcial', async () => {
    const media = new Media(); const observer = callbacks()
    const close = await attachHlsPlayback(mediaElement(media), session, new AbortController().signal, observer, loader)
    const stream = FakeHls.instances[0]
    expect(stream.attachMedia).toHaveBeenCalledWith(media)
    expect(media.src).toBe('')
    expect(stream.loadSource).not.toHaveBeenCalled()
    stream.emit('attached')
    expect(stream.loadSource).toHaveBeenCalledWith(session.url)
    expect(observer.onReady).not.toHaveBeenCalled()
    media.dispatchEvent(new Event('loadeddata'))
    expect(observer.onReady).toHaveBeenCalledOnce()
    close()
  })

  it('usa o fallback nativo quando MSE não está disponível e informa falha de formato', async () => {
    FakeHls.supported = false
    const media = new Media(); const observer = callbacks()
    const close = await attachHlsPlayback(mediaElement(media), session, new AbortController().signal, observer, loader)
    expect(media.src).toBe(session.url)
    expect(media.load).toHaveBeenCalledOnce()
    media.error = { code: 4 }; media.dispatchEvent(new Event('error'))
    expect(observer.onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'MEDIA:4' }))
    close()
  })

  it('descarta inicialização assíncrona depois de cancelar uma sessão antiga', async () => {
    let resolve!: (value: typeof Hls) => void
    const pending = new Promise<typeof Hls>((done) => { resolve = done })
    const abort = new AbortController(); const observer = callbacks()
    const setup = attachHlsPlayback(mediaElement(new Media()), session, abort.signal, observer, () => pending)
    abort.abort(); resolve(FakeHls as unknown as typeof Hls)
    await setup
    expect(FakeHls.instances).toHaveLength(0)
    expect(observer.onReady).not.toHaveBeenCalled()
    expect(observer.onError).not.toHaveBeenCalled()
  })

  it('remove callbacks e destrói o stream ao desmontar', async () => {
    const media = new Media(); const observer = callbacks(); const abort = new AbortController()
    await attachHlsPlayback(mediaElement(media), session, abort.signal, observer, loader)
    const stream = FakeHls.instances[0]
    abort.abort()
    stream.emit('attached'); media.dispatchEvent(new Event('loadeddata'))
    expect(stream.destroy).toHaveBeenCalledOnce()
    expect(stream.loadSource).not.toHaveBeenCalled()
    expect(observer.onReady).not.toHaveBeenCalled()
  })

  it('tenta recuperação de decodificação uma única vez e depois mostra a causa', async () => {
    const observer = callbacks()
    const close = await attachHlsPlayback(mediaElement(new Media()), session, new AbortController().signal, observer, loader)
    const stream = FakeHls.instances[0]
    const error = { type: 'mediaError', details: 'bufferAppendError', fatal: true } as ErrorData
    stream.emit('error', error); stream.emit('error', error)
    expect(stream.recoverMediaError).toHaveBeenCalledOnce()
    expect(observer.onError).toHaveBeenCalledOnce()
    expect(observer.onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'HLS:bufferAppendError' }))
    close()
  })
})

describe('diagnóstico sem segredos', () => {
  it('distingue autorização recusada de falha de rede, sem sugerir renovação para todo erro', () => {
    const auth = hlsPlaybackIssue({ type: 'networkError', details: 'manifestLoadError', response: { code: 403 } } as ErrorData)
    const network = hlsPlaybackIssue({ type: 'networkError', details: 'fragLoadError', response: { code: 0 } } as ErrorData)
    expect(auth.renewSession).toBe(true)
    expect(auth.code).toContain('HTTP 403')
    expect(network.renewSession).toBeUndefined()
    expect(network.message).toContain('proteção do navegador')
  })

  it('não inclui URL assinada, corpo de resposta ou mensagem de rede no diagnóstico', () => {
    const issue = hlsPlaybackIssue({ type: 'networkError', details: session.url, response: { code: 404, text: session.url }, url: session.url } as unknown as ErrorData)
    expect(JSON.stringify(issue)).not.toContain('secret')
    expect(JSON.stringify(issue)).not.toContain('https://')
    expect(issue.message).toContain('não está disponível')
  })
})
