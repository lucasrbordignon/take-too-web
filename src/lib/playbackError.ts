import { AxiosError } from 'axios'

export function playbackErrorMessage(reason: unknown, portal = false): string {
  if (reason instanceof AxiosError) {
    const status = reason.response?.status
    const message = reason.response?.data?.message
    if (status === 503 && typeof message === 'string' && message.includes('Chave de reprodução')) {
      return portal ? 'Vídeo temporariamente indisponível. Avise o profissional responsável.'
        : 'A chave de reprodução do Mux não está configurada na API. Configure MUX_SIGNING_KEY_ID e MUX_SIGNING_PRIVATE_KEY e recrie o container da API.'
    }
    if (status === 401 || status === 403) return 'Seu acesso ao vídeo expirou ou não está autorizado. Acesse novamente.'
  }
  return 'Não foi possível preparar o vídeo. Tente novamente.'
}
