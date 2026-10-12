import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { VideoDTO } from '../../api/types.ts'
import { videosService } from '../../services/videos.service.ts'

/** Apenas imagens autorizadas; nunca carrega o stream para gerar a miniatura. */
export function VideoThumbnail({ video, compact = false }: { video: VideoDTO; compact?: boolean }) {
  const container = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const element = container.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      const timer = window.setTimeout(() => setVisible(true), 0)
      return () => window.clearTimeout(timer)
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { rootMargin: '80px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const preview = useQuery({
    queryKey: ['video-thumbnail', video.id],
    queryFn: () => videosService.criarPlayback(video.id),
    enabled: visible && video.status === 'PRONTO',
    staleTime: (query) => Math.max(0, new Date(query.state.data?.expiraEm ?? 0).getTime() - Date.now() - 30000),
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const seconds = video.duracaoSegundos
  const duration = seconds == null ? null : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  return <span ref={container} className={`relative isolate block shrink-0 overflow-hidden rounded-lg bg-[#0B0D12] ${compact ? 'h-16 w-24 sm:h-20 sm:w-32' : 'aspect-video w-full'}`} aria-hidden="true">
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#667085]">
      <svg width={compact ? 24 : 36} height={compact ? 24 : 36} viewBox="0 0 32 32" fill="none"><rect x={video.orientacao === 'VERTICAL' ? 9 : 3} y={video.orientacao === 'VERTICAL' ? 3 : 7} width={video.orientacao === 'VERTICAL' ? 14 : 26} height={video.orientacao === 'VERTICAL' ? 26 : 18} rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="m13 11 8 5-8 5V11Z" fill="currentColor"/></svg>
      {!compact && <span className="text-xs">{video.status === 'PROCESSANDO' ? 'Processando…' : video.status === 'PRONTO' ? 'Vídeo' : 'Prévia indisponível'}</span>}
    </span>
    {video.status === 'PRONTO' && preview.data?.miniaturaUrl && <img key={preview.data.miniaturaUrl} src={preview.data.miniaturaUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none' }} className="absolute inset-0 h-full w-full bg-[#0B0D12] object-contain" />}
    {duration && <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">{duration}</span>}
  </span>
}
