import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { AxiosError } from 'axios'
import type { VideoPlaybackDTO } from '../api/types.ts'
import { attachHlsPlayback } from '../lib/hlsPlayback.ts'
import type { PlaybackIssue } from '../lib/hlsPlayback.ts'
import { playbackErrorMessage } from '../lib/playbackError.ts'

export function useSignedPlayback(mediaRef: RefObject<HTMLVideoElement | null>, identity: string,
  request: () => Promise<VideoPlaybackDTO>, initialSeekTime = 0, portal = false) {
  const requestRef = useRef(request)
  useEffect(() => { requestRef.current = request }, [request])
  const retryRef = useRef<() => void>(() => undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PlaybackIssue | null>(null)
  useEffect(() => {
    const media = mediaRef.current
    if (!media) return
    let disposed = false
    let generation = 0
    let controller: AbortController | undefined
    let detach: (() => void) | undefined
    let renewal: ReturnType<typeof setTimeout> | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    let authorizationRetried = false
    const load = async (preserve: boolean) => {
      const current = ++generation
      const position = preserve ? media.currentTime : initialSeekTime
      const resume = preserve && !media.paused
      clearTimeout(renewal)
      clearTimeout(timeout)
      controller?.abort()
      detach?.()
      media.pause()
      media.removeAttribute('src')
      media.load()
      controller = new AbortController()
      const signal = controller.signal
      const active = () => !disposed && current === generation && !signal.aborted
      setLoading(true)
      setError(null)
      const fail = (issue: PlaybackIssue) => {
        if (!active()) return
        if (issue.renewSession && !authorizationRetried) {
          authorizationRetried = true
          void load(true)
          return
        }
        clearTimeout(timeout)
        setLoading(false)
        setError(issue)
      }
      timeout = setTimeout(() => fail({ message: 'O vídeo demorou demais para carregar. Verifique sua conexão e os bloqueios do navegador.', code: 'HLS:LOAD_TIMEOUT' }), 30000)
      const metadata = () => {
        if (!active()) return
        if (position > 0) media.currentTime = Number.isFinite(media.duration) ? Math.min(position, media.duration) : position
        if (resume) void media.play().catch(() => undefined)
      }
      media.addEventListener('loadedmetadata', metadata, { once: true, signal })
      try {
        const session = await requestRef.current()
        if (!active()) return
        media.poster = session.miniaturaUrl ?? ''
        const close = await attachHlsPlayback(media, session, signal, {
          onReady: () => { if (active()) { clearTimeout(timeout); setLoading(false); setError(null) } },
          onError: fail,
        })
        if (!active()) { close(); return }
        detach = close
        const remaining = new Date(session.expiraEm).getTime() - Date.now()
        if (Number.isFinite(remaining) && remaining > 0) renewal = setTimeout(() => void load(true), Math.max(1000, remaining - 30000))
      } catch (reason) {
        if (active()) fail({ message: playbackErrorMessage(reason, portal), code: reason instanceof AxiosError ? `API:HTTP_${reason.response?.status ?? 'NETWORK'}` : 'API:PLAYBACK_FAILED' })
      }
    }
    retryRef.current = () => { authorizationRetried = false; void load(true) }
    void load(false)
    return () => {
      disposed = true
      ++generation
      clearTimeout(renewal)
      clearTimeout(timeout)
      controller?.abort()
      detach?.()
      media.pause()
      media.removeAttribute('src')
      media.load()
    }
  }, [mediaRef, identity, initialSeekTime, portal])
  return { loading, error, retry: () => retryRef.current() }
}
