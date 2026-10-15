import { useCallback, useRef } from 'react'
import type { VideoDTO } from '../../api/types.ts'
import { useSignedPlayback } from '../../hooks/useSignedPlayback.ts'
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
  const request = useCallback(() => videosService.criarPlayback(video.id), [video.id])
  const { loading: isLoading, error, retry } = useSignedPlayback(mediaRef, `library:${video.id}`, request)

  return (
    <div className="fixed inset-0 z-50 bg-black/85 p-3 sm:p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Reproduzir ${video.nome}`}>
      <div className="w-full max-w-5xl max-h-[calc(100dvh-1.5rem)] bg-[#12151C] border border-[#343946] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <header className="min-h-14 px-4 sm:px-5 flex items-center justify-between gap-3 border-b border-[#343946]/60">
          <div className="min-w-0"><h2 className="font-semibold text-[#F8FAFC] truncate">{video.nome}</h2><p className="text-xs text-[#A8B0C0]">Reprodução privada</p></div>
          <button type="button" onClick={onClose} className="w-11 h-11 rounded-lg text-[#A8B0C0] hover:bg-[#242832] hover:text-white" aria-label="Fechar player">×</button>
        </header>
        <div className="p-3 sm:p-5 bg-[#07090D] flex justify-center min-h-0">
          <div className={`relative w-full ${playerHeight(video)} max-h-[calc(100dvh-10rem)]`}>
            <video ref={mediaRef} controls playsInline className="w-full h-full object-contain" />
            {isLoading && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/50 text-sm text-[#E2E5EA]">Preparando reprodução…</div>}
          </div>
        </div>
        {error && <div className="px-4 pb-4 flex flex-wrap gap-3 items-center text-sm text-[#FCA5A5]" role="alert"><div><p>{error.message}</p><details className="mt-2 text-xs text-[#A8B0C0]"><summary className="cursor-pointer">Detalhes do erro</summary><p className="mt-1 font-mono">{error.code}</p></details></div><button type="button" onClick={retry} className="h-10 px-3 rounded-lg bg-[#242832] text-white font-semibold">Tentar novamente</button></div>}
      </div>
    </div>
  )
}
