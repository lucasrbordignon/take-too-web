// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ImagePicker } from './ImagePicker.tsx'
const mocks = vi.hoisted(() => ({ list: vi.fn(), confirm: vi.fn(), upload: vi.fn(), selected: vi.fn(), busy: vi.fn() }))
vi.mock('../services/imagens.service.ts', () => ({ imagensService: { listar: mocks.list, confirmar: mocks.confirm, criarUpload: mocks.upload, visualizar: vi.fn(), excluir: vi.fn() } }))
let root: Root
let container: HTMLDivElement
let client: QueryClient
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  mocks.list.mockResolvedValue({ content: [{ id: 'pending', nome: 'Envio anterior', status: 'AGUARDANDO_UPLOAD' }], totalPages: 1 })
  mocks.confirm.mockResolvedValue({ id: 'pending', nome: 'Envio anterior', status: 'PRONTA' })
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
  await act(async () => { root.render(<QueryClientProvider client={client}><ImagePicker projetoId="project" selected={null} onSelected={mocks.selected} onBusyChange={mocks.busy} /></QueryClientProvider>); await new Promise((resolve) => setTimeout(resolve, 30)) })
})
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals() })
it('recupera arquivo enviado anteriormente sem criar outro upload nem publicar versão', async () => {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
  const recover = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Verificar envio')!
  expect(recover).toBeDefined()
  await act(async () => recover.click())
  expect(mocks.confirm).toHaveBeenCalledExactlyOnceWith('pending')
  expect(mocks.selected).toHaveBeenCalledWith(expect.objectContaining({ id: 'pending', status: 'PRONTA' }))
  expect(mocks.upload).not.toHaveBeenCalled()
})
it('impede selecionar upload pendente e informa formatos aceitos antes do envio', () => {
  const item = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Envio anterior'))
  if (item) expect(item.disabled).toBe(true)
  expect(container.querySelector('input[type="file"]')?.getAttribute('accept')).toBe('image/jpeg,image/png')
  expect(mocks.upload).not.toHaveBeenCalled()
})
