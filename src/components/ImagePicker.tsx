import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import type { ImagemDTO, ImagemUploadDTO } from '../api/types.ts'
import { imagensService } from '../services/imagens.service.ts'

function errorMessage(error: unknown) {
  return error instanceof AxiosError && typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Não foi possível concluir a operação. Tente novamente.'
}
function ImagePreview({ imagem }: { imagem: ImagemDTO }) {
  const image = useQuery({ queryKey: ['image-preview', imagem.id], queryFn: () => imagensService.visualizar(imagem.id), enabled: imagem.status === 'PRONTA', staleTime: 5 * 60 * 1000, retry: false })
  return <span className="relative grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#0B0D12] text-xs text-[#667085]">Imagem{image.data && <img src={image.data.url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none' }} className="absolute inset-0 h-full w-full bg-[#0B0D12] object-contain" />}</span>
}
export function ImagePicker({ projetoId, selected, onSelected, onBusyChange, disabled = false }: { projetoId?: string; selected: ImagemDTO | null; onSelected: (image: ImagemDTO | null) => void; onBusyChange: (busy: boolean) => void; disabled?: boolean }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'upload' | 'library'>('upload')
  const [page, setPage] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<'idle' | 'preparing' | 'uploading' | 'validating'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ImagemDTO | null>(null)
  const session = useRef<ImagemUploadDTO | null>(null)
  const xhr = useRef<XMLHttpRequest | null>(null)
  const mounted = useRef(true)
  const operating = useRef(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  useEffect(() => { onBusyChange(busy) }, [busy, onBusyChange])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; xhr.current?.abort() } }, [])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const list = useQuery({ queryKey: ['images', mode === 'upload' ? projetoId : 'library', page], queryFn: () => imagensService.listar(mode === 'upload' ? projetoId : undefined, page), retry: false })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['images'] })
  const finish = async (image: ImagemDTO) => {
    if (image.status !== 'PRONTA') throw new Error(image.erro ?? 'Imagem inválida. Selecione outro arquivo.')
    if (!mounted.current) return
    onSelected(image); session.current = null; setFile(null); setPreview(null); setName(''); setPage(0); await refresh()
  }
  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || !name.trim() || disabled || operating.current) return
    operating.current = true; setBusy(true); setStage('preparing'); setError(null); setProgress(0); setConfirmCancel(false)
    try {
      if (session.current) {
        setStage('validating')
        try { await finish(await imagensService.confirmar(session.current.imagem.id)); return }
        catch (reason) { if (!(reason instanceof AxiosError && reason.response?.status === 400)) throw reason }
      }
      if (!session.current) {
        setStage('preparing')
        const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
        const checksum = btoa(String.fromCharCode(...new Uint8Array(digest)))
        session.current = await imagensService.criarUpload({ nome: name.trim(), tipo: file.type, tamanhoBytes: file.size, checksum }, projetoId)
      } else if (new Date(session.current.expiraEm).getTime() <= Date.now()) {
        session.current = await imagensService.buscarUpload(session.current.imagem.id)
      }
      if (!mounted.current) return
      const upload = session.current
      setStage('uploading')
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest(); xhr.current = request
        request.open('PUT', upload.url); request.withCredentials = false; request.timeout = 120000
        for (const [key, value] of Object.entries(upload.headers)) request.setRequestHeader(key, value)
        request.upload.onprogress = (event) => { if (mounted.current && event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)) }
        request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error('Não foi possível concluir o envio. Tente novamente.'))
        request.onerror = () => reject(new Error('Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.'))
        request.ontimeout = () => reject(new Error('O envio demorou demais. Verifique sua conexão e tente novamente.'))
        request.onabort = () => reject(new DOMException('Envio cancelado.', 'AbortError'))
        request.send(file)
      })
      setStage('validating')
      await finish(await imagensService.confirmar(upload.imagem.id))
    } catch (reason) {
      if (mounted.current) setError(reason instanceof AxiosError ? errorMessage(reason) : reason instanceof Error ? reason.message : 'Não foi possível enviar a imagem.')
    } finally {
      operating.current = false; xhr.current = null
      if (mounted.current) { setBusy(false); setStage('idle'); setConfirmCancel(false) }
    }
  }
  const recover = async (image: ImagemDTO) => {
    if (operating.current || disabled) return
    operating.current = true; setBusy(true); setError(null)
    try { await finish(await imagensService.confirmar(image.id)) }
    catch (reason) { setError(reason instanceof AxiosError ? errorMessage(reason) : reason instanceof Error ? reason.message : 'Não foi possível recuperar a imagem.') }
    finally { operating.current = false; if (mounted.current) setBusy(false) }
  }
  const remove = async () => {
    if (!deleting || operating.current) return
    operating.current = true; setBusy(true); setError(null)
    try { await imagensService.excluir(deleting.id); if (selected?.id === deleting.id) onSelected(null); setDeleting(null); await refresh() }
    catch (reason) { setError(errorMessage(reason)) }
    finally { operating.current = false; if (mounted.current) setBusy(false) }
  }
  return <section className="mt-4">
    <nav role="tablist" aria-label="Origem da imagem" className="flex border-b border-[#343946]">{(['upload', 'library'] as const).map((tab) => <button type="button" key={tab} disabled={disabled || busy} role="tab" aria-selected={mode === tab} onClick={() => { setMode(tab); setPage(0); setError(null) }} className={`min-h-12 flex-1 border-b-2 px-3 text-sm ${mode === tab ? 'border-[#A78BFA] text-[#C4B5FD]' : 'border-transparent text-[#A8B0C0]'}`}>{tab === 'upload' ? 'Enviar imagem' : 'Biblioteca'}</button>)}</nav>
    {mode === 'upload' && <form onSubmit={(event) => void send(event)} className="mt-4 space-y-3">
      <label className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#667085] bg-[#12151C] p-4 text-sm ${disabled || busy ? 'pointer-events-none opacity-50' : ''}`}>Selecionar imagem<span className="mt-1 text-xs text-[#A8B0C0]">JPEG ou PNG · até 10 MB</span><input type="file" accept="image/jpeg,image/png" disabled={disabled || busy} className="sr-only" onChange={(event) => {
        const next = event.target.files?.[0] ?? null
        session.current = null; setError(null); setProgress(0)
        if (next && (!['image/jpeg', 'image/png'].includes(next.type) || next.size > 10 * 1024 * 1024)) { setFile(null); setPreview(null); setError('Selecione uma imagem JPEG/PNG de até 10 MB.'); return }
        setFile(next); setName(next?.name ?? ''); setPreview(next ? URL.createObjectURL(next) : null)
      }} /></label>
      {file && <><img src={preview ?? undefined} alt="Prévia do arquivo selecionado" className="mx-auto max-h-64 w-full rounded-lg object-contain" /><label className="block text-sm">Nome<input required disabled={disabled || busy} maxLength={255} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#343946] bg-[#12151C] px-3" /></label><button disabled={disabled || busy || !name.trim()} className="min-h-11 w-full rounded-lg bg-[#8B5CF6] text-sm font-semibold disabled:opacity-40">{busy ? stage === 'preparing' ? 'Preparando…' : stage === 'validating' ? 'Validando imagem…' : `Enviando… ${progress}%` : 'Enviar imagem'}</button></>}
      {stage === 'uploading' && <div><button type="button" onClick={() => { if (confirmCancel) xhr.current?.abort(); else setConfirmCancel(true) }} className="min-h-11 text-sm text-red-300">{confirmCancel ? 'Confirmar cancelamento' : 'Cancelar envio'}</button>{confirmCancel && <button type="button" onClick={() => setConfirmCancel(false)} className="ml-4 min-h-11 text-sm">Continuar envio</button>}</div>}
    </form>}
    {list.isPending && <p role="status" className="py-4 text-sm text-[#A8B0C0]">Carregando imagens…</p>}
    {list.isError && <p role="alert" className="py-3 text-sm text-red-300">{errorMessage(list.error)}<button type="button" onClick={() => void list.refetch()} className="ml-3 min-h-11 underline">Tentar novamente</button></p>}
    <ul className="mt-4 space-y-2">{list.data?.content.map((image) => <li key={image.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${selected?.id === image.id ? 'border-[#A78BFA]' : 'border-[#343946]'}`}><button type="button" disabled={image.status !== 'PRONTA' || disabled || busy} aria-pressed={selected?.id === image.id} onClick={() => onSelected(image)} className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-50"><ImagePreview imagem={image} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{image.nome}</span><span className="block text-xs text-[#A8B0C0]">{image.status === 'PRONTA' ? `${image.largura} × ${image.altura}` : image.status === 'ERRO' ? image.erro : 'Aguardando arquivo'}</span></span></button>{image.status === 'AGUARDANDO_UPLOAD' && <button type="button" disabled={disabled || busy} onClick={() => void recover(image)} className="min-h-11 px-2 text-xs text-[#C4B5FD]">Verificar envio</button>}<button type="button" disabled={disabled || busy} onClick={() => { setDeleting(image); setError(null) }} className="min-h-11 px-2 text-xs text-red-300">Excluir</button></li>)}</ul>
    {mode === 'library' && list.data?.content.length === 0 && <p className="py-4 text-sm text-[#A8B0C0]">Sua biblioteca de imagens está vazia.</p>}
    {list.data && list.data.totalPages > 1 && <nav aria-label="Paginação de imagens" className="mt-3 flex justify-between text-sm"><button type="button" disabled={busy || list.data.first} onClick={() => setPage((value) => value - 1)} className="min-h-11 px-3">Anterior</button><span className="py-3">{list.data.number + 1} / {list.data.totalPages}</span><button type="button" disabled={busy || list.data.last} onClick={() => setPage((value) => value + 1)} className="min-h-11 px-3">Próxima</button></nav>}
    {deleting && <section className="mt-3 rounded-xl border border-red-400/40 p-3"><p className="text-sm">Excluir “{deleting.nome}”? Imagens publicadas são protegidas.</p><button type="button" disabled={busy} onClick={() => void remove()} className="mr-4 min-h-11 text-sm text-red-300">Confirmar exclusão</button><button type="button" disabled={busy} onClick={() => setDeleting(null)} className="min-h-11 text-sm">Cancelar</button></section>}
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  </section>
}
