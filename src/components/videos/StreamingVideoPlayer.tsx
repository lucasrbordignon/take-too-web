import type Hls from 'hls.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { VideoDTO } from '../../api/types.ts'
import { videosService } from '../../services/videos.service.ts'

interface StreamingVideoPlayerProps {
  video: VideoDTO
  onClose: () => void
}

function playerHeight(video: VideoDTO) {
  if (!video.largura || !video.altura) return 'aspect-video'
  return video.altura > video.largura ? 'aspect-[9/16]' : video.largura === video.altura ? 'aspect-square' : 'aspect-video'
}

export function StreamingVideoPlayer({ video, onClose }: StreamingVideoPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const renewTimerRef = useRef<number | null>(null)
  const recoveryRef = useRef(false)
  const loadPlaybackRef = useRef<(preservePosition?: boolean, resume?: boolean) => Promise<void>>(() => Promise.resolve())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cleanupStream = useCallback(() => {
    if (renewTimerRef.current) window.clearTimeout(renewTimerRef.current)
    renewTimerRef.current = null
    hlsRef.current?.destroy()
    hlsRef.current = null
  }, [])

  const loadPlayback = useCallback(async (preservePosition = false, resume = false) => {
    const media = mediaRef.current
    if (!media) return
    const position = preservePosition ? media.currentTime : 0
    cleanupStream()
    setIsLoading(true)
    setError(null)
    try {
      const playback = await videosService.criarPlayback(video.id)
      const attach = () => {
        if (position > 0) media.currentTime = position
        if (resume) void media.play().catch(() => undefined)
      }
      if (media.canPlayType(playback.tipo)) {
        media.src = playback.url
        media.onloadedmetadata = attach
      } else {
        const { default: HlsPlayer } = await import('hls.js')
        if (!HlsPlayer.isSupported()) {
          setError('Este navegador não suporta reprodução de vídeo neste formato.')
          return
        }
        const hls = new HlsPlayer()
        hlsRef.current = hls
        hls.on(HlsPlayer.Events.MANIFEST_PARSED, attach)
        hls.on(HlsPlayer.Events.ERROR, (_event, data) => {
          if (!data.fatal) return
          if (!recoveryRef.current) {
            recoveryRef.current = true
            void loadPlaybackRef.current(true, !media.paused).finally(() => { recoveryRef.current = false })
          } else {
            setError('A reprodução foi interrompida. Atualize a sessão para tentar novamente.')
          }
        })
        hls.loadSource(playback.url)
        hls.attachMedia(media)
      }
      const expiresIn = new Date(playback.expiraEm).getTime() - Date.now()
      if (Number.isFinite(expiresIn) && expiresIn > 0) {
        renewTimerRef.current = window.setTimeout(() => void loadPlaybackRef.current(true, !media.paused), expiresIn + 500)
      }
    } catch {
      setError('Não foi possível preparar a reprodução. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }, [cleanupStream, video.id])

  useEffect(() => { loadPlaybackRef.current = loadPlayback }, [loadPlayback])

  useEffect(() => {
    const media = mediaRef.current
    const initialLoad = window.setTimeout(() => void loadPlayback(), 0)
    return () => {
      window.clearTimeout(initialLoad)
      cleanupStream()
      if (media) {
        media.pause()
        media.removeAttribute('src')
        media.load()
      }
    }
  }, [cleanupStream, loadPlayback])

  return (
    <div className="fixed inset-0 z-50 bg-black/85 p-3 sm:p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Reproduzir ${video.nome}`}>
      <div className="w-full max-w-5xl max-h-[calc(100dvh-1.5rem)] bg-[#12151C] border border-[#343946] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <header className="min-h-14 px-4 sm:px-5 flex items-center justify-between gap-3 border-b border-[#343946]/60">
          <div className="min-w-0"><h2 className="font-semibold text-[#F8FAFC] truncate">{video.nome}</h2><p className="text-xs text-[#A8B0C0]">Reprodução privada</p></div>
          <button type="button" onClick={onClose} className="w-11 h-11 rounded-lg text-[#A8B0C0] hover:bg-[#242832] hover:text-white" aria-label="Fechar player">×</button>
        </header>
        <div className="p-3 sm:p-5 bg-[#07090D] flex justify-center min-h-0">
          <div className={`relative w-full ${playerHeight(video)} max-h-[calc(100dvh-10rem)]`}>
            <video ref={mediaRef} controls playsInline className="w-full h-full object-contain" onError={() => setError('Não foi possível reproduzir este vídeo.')} />
            {isLoading && <div className="absolute inset-0 grid place-items-center bg-black/50 text-sm text-[#E2E5EA]">Preparando reprodução…</div>}
          </div>
        </div>
        {error && <div className="px-4 pb-4 flex flex-wrap gap-3 items-center text-sm text-[#FCA5A5]" role="alert"><span>{error}</span><button type="button" onClick={() => void loadPlayback(true, false)} className="h-10 px-3 rounded-lg bg-[#242832] text-white font-semibold">Tentar novamente</button></div>}
      </div>
    </div>
  )
}
