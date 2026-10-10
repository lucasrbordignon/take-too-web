import type { VideoUploadDTO } from '../api/types.ts'

export class UploadProtocolError extends Error {}
export class UploadNetworkError extends Error {}

export interface DirectUpload {
  cancel: () => void
  done: Promise<void>
}

/**
 * Deliberately uses XMLHttpRequest instead of the authenticated API client.
 * Upload URLs are provider URLs; TakeToo's JWT must never leave the API origin.
 */
export function uploadVideoDirectly(
  session: VideoUploadDTO,
  file: File,
  onProgress: (loaded: number, total: number) => void,
): DirectUpload {
  if (session.protocolo !== 'HTTP_CONTENT_RANGE') {
    throw new UploadProtocolError('Este tipo de envio ainda não é compatível com o aplicativo.')
  }

  const request = new XMLHttpRequest()
  const done = new Promise<void>((resolve, reject) => {
    request.open(session.metodo, session.url, true)
    request.withCredentials = false
    Object.entries(session.headers).forEach(([name, value]) => request.setRequestHeader(name, value))
    if (!Object.keys(session.headers).some((name) => name.toLowerCase() === 'content-type')) {
      request.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    }
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded, event.total)
    }
    request.onerror = () => reject(new UploadNetworkError('Não foi possível conectar ao serviço de envio.'))
    request.onabort = () => reject(new DOMException('Envio cancelado', 'AbortError'))
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve()
      else reject(new Error(`O envio foi recusado (${request.status}).`))
    }
    request.send(file)
  })

  return { cancel: () => request.abort(), done }
}
