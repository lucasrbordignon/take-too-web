import { useCallback, useEffect, useRef } from 'react'
import type { ComponentProps } from 'react'
import type { VersaoDTO } from '../api/types.ts'
import { portalService } from '../services/portal.service.ts'
import { versoesService } from '../services/versoes.service.ts'
import { useSignedPlayback } from '../hooks/useSignedPlayback.ts'
import { VersionImage } from './VersionImage.tsx'
import { VideoPlayer } from './shared/VideoPlayer.tsx'

type Props = Omit<ComponentProps<typeof VideoPlayer>, 'src'> & {
  versao?: VersaoDTO | null
  projetoId?: string
  portal?: boolean
}

export function VersionVideoPlayer(props: Props) {
  if (props.versao?.imagemId) return <VersionImage key={props.versao.id} versao={props.versao} projetoId={props.projetoId} portal={props.portal} />
  if (!props.versao?.videoId) return <VideoPlayer {...props} src={props.versao?.arquivoUrl ?? undefined} />
  return <SignedVersionPlayer key={`${props.portal}:${props.versao.id}`} {...props} />
}

function SignedVersionPlayer({ versao, projetoId, portal, markers = [], seekRequest, initialSeekTime = 0,
  onTimeUpdate, onDurationChange }: Props) {
  const mediaRef = useRef<HTMLVideoElement>(null)
  const request = useCallback(() => portal
    ? portalService.criarPlayback(versao!.id!)
    : versoesService.criarPlayback(projetoId!, versao!.id!), [portal, projetoId, versao])
  const { loading, error, retry } = useSignedPlayback(mediaRef,
    `${portal ? 'portal' : projetoId}:${versao?.id}`, request, initialSeekTime, portal)

  useEffect(() => {
    if (seekRequest && mediaRef.current) mediaRef.current.currentTime = seekRequest.time
  }, [seekRequest])

  const width = versao?.video?.largura || 16
  const height = versao?.video?.altura || 9
  return <section aria-label="Vídeo da versão" className="w-full min-w-0 rounded-2xl border border-[#343946] bg-[#07090D] p-3 sm:p-4">
    <div className="relative mx-auto max-w-full" style={{ aspectRatio: `${width}/${height}`, width: `min(100%, calc(65dvh * ${width / height}))` }}>
      <video ref={mediaRef} controls playsInline className="w-full h-full max-h-[65dvh] object-contain"
        onTimeUpdate={(e) => onTimeUpdate(Math.floor(e.currentTarget.currentTime))}
        onDurationChange={(e) => { if (Number.isFinite(e.currentTarget.duration)) onDurationChange(Math.floor(e.currentTarget.duration)) }} />
      {loading && <p className="pointer-events-none absolute inset-0 grid place-items-center bg-black/60 text-sm text-white" role="status">Preparando vídeo…</p>}
    </div>
    {error && <div role="alert" className="mt-3 flex flex-col sm:flex-row gap-2 text-sm text-red-300"><div><p>{error.message}</p><details className="mt-2 text-xs text-[#A8B0C0]"><summary className="cursor-pointer">Detalhes do erro</summary><p className="mt-1 font-mono">{error.code}</p></details></div><button type="button" onClick={retry} className="min-h-11 px-3 rounded-lg bg-[#242832] text-white">Tentar novamente</button></div>}
    {!!markers.length && <nav aria-label="Comentários por tempo" className="mt-3 flex flex-wrap gap-2">{markers.map((marker) => <button key={marker.id} type="button" title={marker.label} onClick={() => { if (mediaRef.current) mediaRef.current.currentTime = marker.timestampSec }} className="min-h-11 px-3 rounded-lg bg-[#242832] text-xs text-[#E2E5EA]">{Math.floor(marker.timestampSec / 60)}:{String(marker.timestampSec % 60).padStart(2, '0')} · Comentário</button>)}</nav>}
  </section>
}
