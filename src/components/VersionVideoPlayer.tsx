import type Hls from 'hls.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import type { VersaoDTO } from '../api/types.ts'
import { portalService } from '../services/portal.service.ts'
import { versoesService } from '../services/versoes.service.ts'
import { playbackErrorMessage } from '../lib/playbackError.ts'
import { VideoPlayer } from './shared/VideoPlayer.tsx'

type Props = Omit<ComponentProps<typeof VideoPlayer>, 'src'> & {
  versao?: VersaoDTO | null
  projetoId?: string
  portal?: boolean
}

export function VersionVideoPlayer(props: Props) {
  if (!props.versao?.videoId) return <VideoPlayer {...props} src={props.versao?.arquivoUrl ?? undefined} />
  return <SignedVersionPlayer key={`${props.portal}:${props.versao.id}`} {...props} />
}

function SignedVersionPlayer({ versao, projetoId, portal, markers = [], seekRequest, initialSeekTime = 0,
  onTimeUpdate, onDurationChange }: Props) {
  const mediaRef = useRef<HTMLVideoElement>(null)
  const request = useCallback(() => portal
    ? portalService.criarPlayback(versao!.id!)
    : versoesService.criarPlayback(projetoId!, versao!.id!), [portal, projetoId, versao])
  // IDs controlam a sessão; atualizações dos metadados não reiniciam o player.
  const requestRef = useRef(request)
  useEffect(() => { requestRef.current = request }, [request])
  const renewRef = useRef<() => void>(() => undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const media = mediaRef.current
    if (!media) return
    let disposed = false
    let generation = 0
    let stream: Hls | undefined
    let timer: number | undefined
    let recovered = false
    const load = async (preserve = false) => {
      const currentGeneration = ++generation
      const position = preserve ? media.currentTime : initialSeekTime
      const resume = preserve && !media.paused
      window.clearTimeout(timer)
      stream?.destroy()
      stream = undefined
      setLoading(true)
      setError(null)
      try {
        const session = await requestRef.current()
        if (disposed || currentGeneration !== generation) return
        if (session.miniaturaUrl) media.poster = session.miniaturaUrl
        const attach = () => {
          if (position > 0) media.currentTime = position
          if (resume) void media.play().catch(() => undefined)
        }
        media.onloadedmetadata = attach
        if (media.canPlayType(session.tipo)) media.src = session.url
        else {
          const { default: HlsPlayer } = await import('hls.js')
          if (disposed || currentGeneration !== generation) return
          if (!HlsPlayer.isSupported()) throw new Error('unsupported')
          stream = new HlsPlayer()
          stream.on(HlsPlayer.Events.ERROR, (_event, data) => {
            if (!data.fatal || disposed || currentGeneration !== generation) return
            if (recovered) setError('Reprodução interrompida. Tente renovar a sessão.')
            else { recovered = true; void load(true) }
          })
          stream.loadSource(session.url)
          stream.attachMedia(media)
        }
        const remaining = new Date(session.expiraEm).getTime() - Date.now()
        if (Number.isFinite(remaining) && remaining > 0) {
          timer = window.setTimeout(() => void load(true), Math.max(1000, remaining - 30000))
        }
      } catch (reason) {
        if (!disposed && currentGeneration === generation) setError(playbackErrorMessage(reason, portal))
      } finally {
        if (!disposed && currentGeneration === generation) setLoading(false)
      }
    }
    renewRef.current = () => { recovered = false; void load(true) }
    void load(false)
    return () => {
      disposed = true
      ++generation
      window.clearTimeout(timer)
      stream?.destroy()
      media.onloadedmetadata = null
      media.pause()
      media.removeAttribute('src')
      media.load()
    }
  }, [versao?.id, projetoId, portal, initialSeekTime])

  useEffect(() => {
    if (seekRequest && mediaRef.current) mediaRef.current.currentTime = seekRequest.time
  }, [seekRequest])

  const width = versao?.video?.largura || 16
  const height = versao?.video?.altura || 9
  return <section aria-label="Vídeo da versão" className="w-full min-w-0 rounded-2xl border border-[#343946] bg-[#07090D] p-3 sm:p-4">
    <div className="relative mx-auto max-w-full" style={{ aspectRatio: `${width}/${height}`, width: `min(100%, calc(65dvh * ${width / height}))` }}>
      <video ref={mediaRef} controls playsInline className="w-full h-full max-h-[65dvh] object-contain"
        onTimeUpdate={(e) => onTimeUpdate(Math.floor(e.currentTarget.currentTime))}
        onDurationChange={(e) => { if (Number.isFinite(e.currentTarget.duration)) onDurationChange(Math.floor(e.currentTarget.duration)) }}
        onError={() => setError('A reprodução foi interrompida. Renove a sessão para tentar novamente.')} />
      {loading && <p className="absolute inset-0 grid place-items-center bg-black/60 text-sm text-white" role="status">Preparando vídeo…</p>}
    </div>
    {error && <div role="alert" className="mt-3 flex flex-col sm:flex-row gap-2 text-sm text-red-300"><p>{error}</p><button type="button" onClick={() => renewRef.current()} className="min-h-11 px-3 rounded-lg bg-[#242832] text-white">Tentar novamente</button></div>}
    {!!markers.length && <nav aria-label="Comentários por tempo" className="mt-3 flex flex-wrap gap-2">{markers.map((marker) => <button key={marker.id} type="button" title={marker.label} onClick={() => { if (mediaRef.current) mediaRef.current.currentTime = marker.timestampSec }} className="min-h-11 px-3 rounded-lg bg-[#242832] text-xs text-[#E2E5EA]">{Math.floor(marker.timestampSec / 60)}:{String(marker.timestampSec % 60).padStart(2, '0')} · Comentário</button>)}</nav>}
  </section>
}
