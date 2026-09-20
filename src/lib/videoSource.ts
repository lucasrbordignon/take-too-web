export type VideoSourceType = 'direct' | 'youtube' | 'google-drive' | 'external' | 'none'

export interface VideoSource {
  type: VideoSourceType
  url?: string
  embedUrl?: string
  videoId?: string
  supportsTimeline: boolean
  message?: string
}

const DIRECT_VIDEO_EXTENSIONS = /\.(mp4|webm|ogv|ogg|mov)(?:$|[?#])/i
const DIRECT_STORAGE_HOSTS = ['amazonaws.com', 'storage.googleapis.com', 'cloudflarestorage.com', 'digitaloceanspaces.com', 'blob.core.windows.net']

function getYouTubeId(url: URL): string | undefined {
  if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0]
  if (url.hostname.endsWith('youtube.com') || url.hostname.endsWith('youtube-nocookie.com')) {
    if (url.pathname === '/watch') return url.searchParams.get('v') || undefined
    const parts = url.pathname.split('/').filter(Boolean)
    if (['embed', 'shorts', 'live'].includes(parts[0])) return parts[1]
  }
  return undefined
}

function getGoogleDriveId(url: URL): string | undefined {
  if (url.hostname !== 'drive.google.com') return undefined
  const match = url.pathname.match(/\/d\/([^/]+)/)
  return match?.[1] || url.searchParams.get('id') || undefined
}

/** Converts a user supplied link into a player strategy; it never fetches the URL. */
export function resolveVideoSource(value?: string): VideoSource {
  const url = value?.trim()
  if (!url) return { type: 'none', supportsTimeline: false }

  try {
    const parsed = new URL(url)
    const youtubeId = getYouTubeId(parsed)
    if (youtubeId) return { type: 'youtube', url, videoId: youtubeId, embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&playsinline=1&rel=0`, supportsTimeline: true }

    const driveId = getGoogleDriveId(parsed)
    if (driveId) return { type: 'google-drive', url, embedUrl: `https://drive.google.com/file/d/${driveId}/preview`, supportsTimeline: false, message: 'O Google Drive não disponibiliza controle de tempo para este player incorporado.' }

    const isStorageHost = DIRECT_STORAGE_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
    if (DIRECT_VIDEO_EXTENSIONS.test(parsed.pathname) || isStorageHost) return { type: 'direct', url, supportsTimeline: true }

    return { type: 'external', url, embedUrl: url, supportsTimeline: false, message: 'Este provedor controla a reprodução fora do portal. Abra o vídeo caso a prévia não carregue.' }
  } catch {
    return { type: 'external', url, supportsTimeline: false, message: 'A URL do vídeo é inválida.' }
  }
}
