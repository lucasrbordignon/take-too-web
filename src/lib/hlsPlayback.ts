import type Hls from 'hls.js'
import type { ErrorData } from 'hls.js'
import type { VideoPlaybackDTO } from '../api/types.ts'

export interface PlaybackIssue { message: string; code: string; renewSession?: boolean }
type HlsConstructor = typeof Hls
interface Callbacks { onReady: () => void; onError: (issue: PlaybackIssue) => void }

export function hlsPlaybackIssue(data: Pick<ErrorData, 'type' | 'details' | 'response'>): PlaybackIssue {
  const status = data.response?.code
  const detail = /^[a-zA-Z0-9_]{1,80}$/.test(data.details) ? data.details : 'streamError'
  const code = `HLS:${detail}${typeof status === 'number' ? ` · HTTP ${status}` : ''}`
  if (status === 401 || status === 403) return { message: 'O servidor de vídeo recusou a autorização de reprodução.', code, renewSession: true }
  if (status === 404 || status === 410) return { message: 'Este vídeo não está disponível no servidor de mídia.', code }
  if (data.type === 'networkError') return { message: 'Não foi possível carregar o vídeo. Verifique a conexão e se a proteção do navegador está bloqueando o carregamento.', code }
  if (data.type === 'mediaError') return { message: 'O navegador não conseguiu decodificar este vídeo.', code }
  return { message: 'Não foi possível reproduzir este formato de vídeo neste navegador.', code }
}

export function nativePlaybackIssue(code?: number): PlaybackIssue {
  const message = code === 2 ? 'O carregamento do vídeo falhou. Verifique a conexão e os bloqueios do navegador.'
    : code === 3 ? 'O navegador não conseguiu decodificar este vídeo.'
    : code === 4 ? 'O navegador não suporta a reprodução nativa deste vídeo.'
    : 'A reprodução foi interrompida pelo navegador.'
  return { message, code: `MEDIA:${code ?? 'UNKNOWN'}` }
}

/** Usa MSE/HLS.js antes do fallback nativo, inclusive quando canPlayType retorna "maybe". */
export async function attachHlsPlayback(media: HTMLVideoElement, session: VideoPlaybackDTO,
  signal: AbortSignal, callbacks: Callbacks, loadHls: () => Promise<HlsConstructor> = async () => (await import('hls.js')).default) {
  let stream: Hls | undefined
  let native = false
  let closed = false
  let recoveredMedia = false
  const ready = () => { if (!closed) callbacks.onReady() }
  const mediaError = () => {
    if (!closed && native && media.error?.code !== 1) callbacks.onError(nativePlaybackIssue(media.error?.code))
  }
  const cleanup = () => {
    if (closed) return
    closed = true
    signal.removeEventListener('abort', cleanup)
    media.removeEventListener('loadeddata', ready)
    media.removeEventListener('canplay', ready)
    media.removeEventListener('error', mediaError)
    stream?.destroy()
  }
  if (signal.aborted) return cleanup
  signal.addEventListener('abort', cleanup, { once: true })
  media.addEventListener('loadeddata', ready)
  media.addEventListener('canplay', ready)
  media.addEventListener('error', mediaError)
  try {
    const HlsPlayer = await loadHls()
    if (closed) return cleanup
    if (HlsPlayer.isSupported()) {
      stream = new HlsPlayer()
      stream.on(HlsPlayer.Events.ERROR, (_event, data) => {
        if (closed || !data.fatal) return
        if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
          recoveredMedia = true
          stream?.recoverMediaError()
          return
        }
        callbacks.onError(hlsPlaybackIssue(data))
      })
      // A fonte é carregada depois que o MediaSource está anexado ao elemento.
      stream.on(HlsPlayer.Events.MEDIA_ATTACHED, () => { if (!closed) stream?.loadSource(session.url) })
      stream.attachMedia(media)
    } else if (media.canPlayType(session.tipo) || media.canPlayType('application/x-mpegURL')) {
      native = true
      media.src = session.url
      media.load()
    } else {
      callbacks.onError({ message: 'Este navegador não oferece suporte ao player de vídeo. Tente um navegador atualizado.', code: 'HLS:UNSUPPORTED' })
    }
  } catch {
    if (!closed) callbacks.onError({ message: 'Não foi possível inicializar o player. Atualize a página para carregar a versão atual.', code: 'HLS:INITIALIZATION_FAILED' })
  }
  return cleanup
}
