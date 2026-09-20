import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolveVideoSource } from '../../lib/videoSource.ts'

export interface VideoMarker { id: string; timestampSec: number; label?: string; color?: string }
interface VideoPlayerProps { src?: string; fallbackTitle?: string; markers?: VideoMarker[]; currentTime: number; totalDuration: number; initialSeekTime?: number; seekRequest?: { time: number; id: number }; onTimeUpdate: (seconds: number) => void; onDurationChange: (duration: number) => void }
interface YouTubePlayer { playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allowSeekAhead: boolean): void; getCurrentTime(): number; getDuration(): number; getPlayerState(): number; destroy(): void }
declare global { interface Window { YT?: { Player: new (element: HTMLElement, options: object) => YouTubePlayer }; onYouTubeIframeAPIReady?: () => void } }

let youtubeApiPromise: Promise<void> | undefined
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve()
  if (youtubeApiPromise) return youtubeApiPromise
  youtubeApiPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    window.onYouTubeIframeAPIReady = () => resolve()
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })
  return youtubeApiPromise
}

export function VideoPlayer({ src, fallbackTitle = 'PREVIEW FRAME', markers = [], currentTime, totalDuration, initialSeekTime, seekRequest, onTimeUpdate, onDurationChange }: VideoPlayerProps) {
  const source = useMemo(() => resolveVideoSource(src), [src])
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const youtubeHostRef = useRef<HTMLDivElement | null>(null)
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null)
  const hasAppliedInitialSeek = useRef(false)
  const formatTimecode = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

  useEffect(() => { hasAppliedInitialSeek.current = false }, [src])
  useEffect(() => {
    if (source.type !== 'youtube' || !source.videoId || !youtubeHostRef.current) return
    let disposed = false
    loadYouTubeApi().then(() => {
      if (disposed || !window.YT?.Player || !youtubeHostRef.current) return
      youtubePlayerRef.current = new window.YT.Player(youtubeHostRef.current, {
        videoId: source.videoId,
        width: '100%', height: '100%', playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: () => {
            const duration = youtubePlayerRef.current?.getDuration()
            if (duration && Number.isFinite(duration)) onDurationChange(Math.floor(duration))
            if (initialSeekTime !== undefined && initialSeekTime >= 0) { youtubePlayerRef.current?.seekTo(initialSeekTime, true); onTimeUpdate(initialSeekTime) }
          },
          onStateChange: (event: { data: number }) => setIsPlaying(event.data === 1),
        },
      })
    })
    return () => { disposed = true; youtubePlayerRef.current?.destroy(); youtubePlayerRef.current = null }
  }, [source.type, source.videoId, initialSeekTime, onDurationChange, onTimeUpdate])

  useEffect(() => {
    if (source.type !== 'youtube' || !isPlaying) return
    const timer = window.setInterval(() => {
      const player = youtubePlayerRef.current
      if (!player) return
      const duration = player.getDuration()
      if (duration && Number.isFinite(duration)) onDurationChange(Math.floor(duration))
      onTimeUpdate(Math.floor(player.getCurrentTime()))
      if (player.getPlayerState() !== 1) setIsPlaying(false)
    }, 500)
    return () => window.clearInterval(timer)
  }, [source.type, isPlaying, onDurationChange, onTimeUpdate])

  const handleSeek = useCallback((timeSec: number) => {
    if (!source.supportsTimeline) return
    const clamped = Math.max(0, Math.min(timeSec, totalDuration))
    onTimeUpdate(clamped)
    if (source.type === 'youtube') youtubePlayerRef.current?.seekTo(clamped, true)
    if (videoRef.current) videoRef.current.currentTime = clamped
  }, [source.supportsTimeline, source.type, totalDuration, onTimeUpdate])

  const togglePlay = () => {
    if (source.type === 'youtube') { if (isPlaying) youtubePlayerRef.current?.pauseVideo(); else youtubePlayerRef.current?.playVideo(); return }
    if (videoRef.current) { if (isPlaying) videoRef.current.pause(); else void videoRef.current.play(); return }
    if (source.type === 'none') setIsPlaying((playing) => !playing)
  }

  useEffect(() => {
    if (!source.supportsTimeline || initialSeekTime === undefined || initialSeekTime < 0 || hasAppliedInitialSeek.current || totalDuration <= 0) return
    hasAppliedInitialSeek.current = true
    handleSeek(initialSeekTime)
  }, [source.supportsTimeline, initialSeekTime, totalDuration, handleSeek])
  useEffect(() => {
    if (seekRequest) handleSeek(seekRequest.time)
  }, [seekRequest, handleSeek])
  useEffect(() => {
    if (source.type !== 'none' || !isPlaying) return
    const interval = window.setInterval(() => { onTimeUpdate(currentTime >= totalDuration ? 0 : currentTime + 1); if (currentTime >= totalDuration) setIsPlaying(false) }, 1000)
    return () => window.clearInterval(interval)
  }, [source.type, isPlaying, currentTime, totalDuration, onTimeUpdate])

  const canControl = source.type === 'direct' || source.type === 'youtube' || source.type === 'none'
  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0
  return <div className="w-full bg-[#07090D] border border-[#2E3440]/60 rounded-[16px] p-3 sm:p-4 flex flex-col gap-3 shadow-xl select-none">
    <div className="w-full aspect-video max-h-[520px] bg-[#111827] rounded-[12px] relative flex items-center justify-center overflow-hidden group">
      {source.type === 'direct' && <video ref={videoRef} src={source.url} className="w-full h-full object-contain" onLoadedMetadata={() => { const duration = videoRef.current?.duration; if (duration && Number.isFinite(duration)) onDurationChange(Math.floor(duration)) }} onTimeUpdate={() => onTimeUpdate(Math.floor(videoRef.current?.currentTime || 0))} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />}
      {source.type === 'youtube' && <div ref={youtubeHostRef} className="w-full h-full" />}
      {(source.type === 'google-drive' || source.type === 'external') && source.embedUrl && <iframe src={source.embedUrl} title="Vídeo incorporado" className="w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />}
      {source.type === 'none' && <div className="flex flex-col items-center justify-center"><span className="font-bold text-[32px] sm:text-[40px] leading-normal text-[#A78BFA] tracking-wider drop-shadow-md">{fallbackTitle}</span><span className="text-[11px] text-[#788194] tracking-widest uppercase font-mono mt-1">CANVAS DE VÍDEO</span></div>}
      {canControl && <button type="button" onClick={togglePlay} className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer z-10" aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}>{isPlaying ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3" /></svg>}</button>}
    </div>
    {!source.supportsTimeline && source.type !== 'none' && <div className="flex items-center justify-between gap-3 px-2 text-[12px] text-[#A8B0C0]"><span>{source.message}</span><a href={source.url} target="_blank" rel="noreferrer" className="shrink-0 text-[#C4B5FD] hover:text-white font-semibold">Abrir vídeo ↗</a></div>}
    {(source.supportsTimeline || source.type === 'none') && <div className="px-1 sm:px-2 flex flex-col gap-2"><div className="relative w-full h-5 flex items-center cursor-pointer select-none" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); handleSeek(Math.floor(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * totalDuration)) }}><div className="w-full h-[6px] bg-[#343946] rounded-[3px] relative overflow-hidden"><div className="h-full bg-[#8B5CF6] rounded-[3px] transition-all" style={{ width: `${progressPercent}%` }} /></div>{markers.map((marker) => <div key={marker.id} onClick={(event) => { event.stopPropagation(); handleSeek(marker.timestampSec) }} style={{ left: `${totalDuration > 0 ? (marker.timestampSec / totalDuration) * 100 : 0}%`, backgroundColor: marker.color }} title={`Comentário em ${formatTimecode(marker.timestampSec)}${marker.label ? `: ${marker.label}` : ''}`} className="absolute w-[5px] h-[16px] bg-[#F59E0B] rounded-[2px] -translate-x-1/2 hover:scale-125 transition-transform cursor-pointer shadow-sm shadow-orange-500/50" />)}</div><div className="flex items-center justify-between text-[12px] font-medium text-[#F8FAFC]"><span className="flex items-center gap-1.5 font-mono"><span>{isPlaying ? '⏸' : '▶'}</span><span>{formatTimecode(currentTime)} / {formatTimecode(totalDuration)}</span></span><span className="text-[11px] text-[#A8B0C0] hidden sm:inline">Clique na barra para navegar ou nos marcadores amarelos</span></div></div>}
  </div>
}
