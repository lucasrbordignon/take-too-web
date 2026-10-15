// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientPortalPage } from './ClientPortalPage.tsx'

const mocks = vi.hoisted(() => ({ save: vi.fn(), mount: vi.fn(), unmount: vi.fn() }))
vi.mock('../api/client.ts', () => ({ getClientToken: () => 'test-token', setClientToken: vi.fn() }))
vi.mock('../hooks/usePortal.ts', () => ({
  usePortalProjeto: () => ({ data: { nome: 'Projeto teste', etapaAtual: 'REVISAO_CLIENTE' }, isLoading: false, isError: false }),
  usePortalVersoes: () => ({ data: [{ id: 'version', numero: 1, videoId: 'video', status: 'DISPONIVEL' }], isLoading: false }),
  usePortalComentarios: () => ({ data: [] }),
  usePortalCriarComentario: () => ({ mutateAsync: mocks.save, isPending: false }),
  usePortalAlterarStatusVersao: () => ({ mutate: vi.fn() }),
}))
vi.mock('../components/VersionVideoPlayer.tsx', async () => {
  const { useEffect } = await import('react')
  return { VersionVideoPlayer: function Player({ onTimeUpdate }: { onTimeUpdate: (time: number) => void }) {
    useEffect(() => { mocks.mount(); return () => mocks.unmount() }, [])
    return <section><video data-testid="review-video" /><button onClick={() => onTimeUpdate(37)}>Avançar 37s</button><button onClick={() => onTimeUpdate(80)}>Avançar 80s</button></section>
  } }
})

let root: Root
let container: HTMLDivElement
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.mount.mockClear(); mocks.unmount.mockClear(); mocks.save.mockReset().mockResolvedValue(undefined)
  container = document.createElement('div'); document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => { root.render(<MemoryRouter initialEntries={['/portal/projetos/test']}><Routes><Route path="/portal/projetos/:id" element={<ClientPortalPage />} /></Routes></MemoryRouter>) })
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })
function button(label: string) {
  const target = Array.from(container.querySelectorAll('button')).find((node) => node.textContent?.includes(label))
  if (!target) throw new Error('Botão não encontrado: '+label)
  return target
}
async function click(label: string) { await act(async () => button(label).click()) }
async function typeFeedback(text: string) {
  const textarea = container.querySelector('textarea')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, text)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function submit() { await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) }) }

describe('feedback sobre a revisão', () => {
  it('mantém o mesmo player, sua posição e os controles ao abrir e fechar o overlay', async () => {
    const video = container.querySelector('video')!
    video.currentTime = 37
    const pause = vi.spyOn(video, 'pause').mockImplementation(() => undefined)
    const load = vi.spyOn(video, 'load').mockImplementation(() => undefined)
    await click('Avançar 37s')
    const trigger = button('Adicionar feedback'); trigger.focus()
    await click('Adicionar feedback')
    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('false')
    expect(container.querySelectorAll('video')).toHaveLength(1)
    expect(container.querySelector('video')).toBe(video)
    expect(video.currentTime).toBe(37)
    expect(document.activeElement).toBe(container.querySelector('textarea'))
    await click('Fechar')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.querySelector('video')).toBe(video)
    expect(mocks.mount).toHaveBeenCalledOnce()
    expect(mocks.unmount).not.toHaveBeenCalled()
    expect(pause).not.toHaveBeenCalled(); expect(load).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(trigger)
  })

  it('envia o segundo capturado ao abrir, mesmo com vídeo avançando durante a escrita', async () => {
    const video = container.querySelector('video')!
    await click('Avançar 37s'); await click('Adicionar feedback')
    await click('Avançar 80s')
    await typeFeedback('Ajustar a cor nesta cena')
    await submit()
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith({ texto: 'Ajustar a cor nesta cena', tempoVideo: 37 })
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.querySelector('video')).toBe(video)
    expect(mocks.mount).toHaveBeenCalledOnce(); expect(mocks.unmount).not.toHaveBeenCalled()
  })

  it('mantém texto e overlay após falha sem reiniciar o vídeo e permite tentar novamente', async () => {
    mocks.save.mockRejectedValueOnce(new Error('network'))
    const video = container.querySelector('video')!
    await click('Adicionar feedback'); await typeFeedback('Ajustar áudio'); await submit()
    expect(container.querySelector('textarea')?.value).toBe('Ajustar áudio')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Seu texto foi mantido')
    expect(container.querySelector('video')).toBe(video)
    expect(mocks.unmount).not.toHaveBeenCalled()
    await submit()
    expect(mocks.save).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('evita envio duplicado e só fecha depois da confirmação do servidor', async () => {
    let finish!: () => void
    mocks.save.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve }))
    await click('Adicionar feedback'); await typeFeedback('Meu comentário')
    await act(async () => {
      const form = container.querySelector('form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(mocks.save).toHaveBeenCalledOnce()
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    await act(async () => finish())
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })
})
