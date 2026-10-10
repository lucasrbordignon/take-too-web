import { afterEach, describe, expect, it, vi } from 'vitest'
import type { VideoUploadDTO } from '../api/types.ts'
import { UploadProtocolError, uploadVideoDirectly } from './directVideoUpload.ts'

class FakeUploadRequest {
  static last: FakeUploadRequest | undefined
  method = ''
  url = ''
  withCredentials = true
  status = 204
  headers = new Map<string, string>()
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null }
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null
  onload: (() => void) | null = null
  open(method: string, url: string) { this.method = method; this.url = url }
  setRequestHeader(name: string, value: string) { this.headers.set(name, value) }
  send() { this.upload.onprogress?.({ lengthComputable: true, loaded: 3, total: 6 } as ProgressEvent); this.onload?.() }
  abort() { this.onabort?.() }
}

const session: VideoUploadDTO = {
  video: { id: 'video-1', nome: 'Teste', status: 'AGUARDANDO_UPLOAD', duracaoSegundos: null, largura: null, altura: null, proporcao: null, orientacao: null, marcaDagua: null, erro: null, criadoEm: '', atualizadoEm: '' },
  url: 'https://upload.example.test/signed-url', metodo: 'PUT', protocolo: 'HTTP_CONTENT_RANGE', headers: { 'X-Upload': 'signed' }, expiraEm: '',
}

afterEach(() => { vi.unstubAllGlobals(); FakeUploadRequest.last = undefined })

describe('uploadVideoDirectly', () => {
  it('envia somente os headers retornados pelo provedor, nunca o JWT do TakeToo', async () => {
    vi.stubGlobal('XMLHttpRequest', class extends FakeUploadRequest { constructor() { super(); FakeUploadRequest.last = this } })
    const progress = vi.fn()
    const file = new File(['video'], 'video.mp4', { type: 'video/mp4' })

    await uploadVideoDirectly(session, file, progress).done

    expect(FakeUploadRequest.last?.url).toBe(session.url)
    expect(FakeUploadRequest.last?.withCredentials).toBe(false)
    expect(FakeUploadRequest.last?.headers.get('Authorization')).toBeUndefined()
    expect(FakeUploadRequest.last?.headers.get('X-Upload')).toBe('signed')
    expect(progress).toHaveBeenCalledWith(3, 6)
  })

  it('não finge suportar protocolos de upload desconhecidos', () => {
    expect(() => uploadVideoDirectly({ ...session, protocolo: 'OUTRO_PROTOCOLO' }, new File([], 'video.mp4'), vi.fn())).toThrow(UploadProtocolError)
  })
})
