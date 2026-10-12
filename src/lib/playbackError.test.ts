import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { expect, it } from 'vitest'
import { playbackErrorMessage } from './playbackError.ts'

it('identifica signing ausente no profissional e mantém instruções técnicas fora do portal', () => {
  const error = new AxiosError('Request failed', undefined, undefined, undefined,
    { status: 503, data: { message: 'Chave de reprodução do Mux não configurada.' } } as AxiosResponse)
  expect(playbackErrorMessage(error)).toContain('MUX_SIGNING_KEY_ID')
  expect(playbackErrorMessage(error, true)).not.toContain('MUX_SIGNING')
  expect(playbackErrorMessage(error, true)).toContain('profissional responsável')
})
it('não expõe detalhes de rede ou URLs assinadas na mensagem de erro', () => {
  expect(playbackErrorMessage(new Error('https://private.test?token=secret'))).not.toContain('secret')
})
