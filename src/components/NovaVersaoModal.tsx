import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import type { VideoDTO } from '../api/types.ts'
import { useCriarVersao } from '../hooks/useVersoes.ts'
import { videosService } from '../services/videos.service.ts'
import { VideoThumbnail } from './videos/VideoThumbnail.tsx'
import { UploadDialog } from '../pages/VideosPage.tsx'

interface Props { isOpen: boolean; onClose: () => void; projetoId: string; proximaVersao?: number; emEdicao?: boolean }
export function NovaVersaoModal(props: Props) {
  return props.isOpen ? <VersionForm key={props.projetoId} {...props} /> : null
}

function message(error: unknown, fallback: string) {
  return error instanceof AxiosError && typeof error.response?.data?.message === 'string' ? error.response.data.message : fallback
}

function VersionForm({ onClose, projetoId, proximaVersao = 1, emEdicao = true }: Props) {
  const queryClient = useQueryClient()
  const publish = useCriarVersao(projetoId)
  const [mode, setMode] = useState<'upload' | 'library'>('upload')
  const [page, setPage] = useState(0)
  const [draftPage, setDraftPage] = useState(0)
  const [selected, setSelected] = useState<VideoDTO | null>(null)
  const [uploadKey, setUploadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<VideoDTO | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const operation = useRef(false)
  const drafts = useQuery({
    queryKey: ['project-videos', projetoId, draftPage],
    queryFn: () => videosService.listarRascunhos(projetoId, draftPage),
    enabled: mode === 'upload',
    refetchInterval: (query) => query.state.data?.content.some((v) => ['CRIANDO_UPLOAD', 'AGUARDANDO_UPLOAD', 'PROCESSANDO'].includes(v.status)) ? 15000 : false,
  })
  const library = useQuery({ queryKey: ['videos', page], queryFn: () => videosService.listar(page), enabled: mode === 'library' })
  const list = mode === 'library' ? library : drafts
  const selectedVideo = useQuery({
    queryKey: ['selected-video', selected?.id],
    queryFn: () => videosService.sincronizar(selected!.id),
    enabled: !!selected,
    initialData: selected ?? undefined,
    staleTime: 5000,
    retry: false,
    refetchInterval: (query) => query.state.data?.status === 'PROCESSANDO' ? 8000 : false,
  })
  const candidate = selectedVideo.data ?? selected

  const canPublish = candidate?.status === 'PRONTO'
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    return () => previous?.focus()
  }, [])

  const refresh = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['project-videos', projetoId] }), queryClient.invalidateQueries({ queryKey: ['videos'] })])
  }
  const remove = async () => {
    if (!deleting || operation.current) return
    operation.current = true; setBusy(true); setError(null)
    try { await videosService.excluir(deleting.id); setDeleting(null); setSelected((current) => current?.id === deleting.id ? null : current); await refresh() }
    catch (reason) { setError(message(reason, 'Não foi possível excluir o vídeo.')) }
    finally { operation.current = false; setBusy(false) }
  }
  const submit = async () => {
    if (!canPublish || !emEdicao || uploading || operation.current) return
    operation.current = true; setError(null)
    try {
      await publish.mutateAsync({ videoId: candidate!.id })
      await refresh()
      closeRef.current()
    } catch (reason) { setError(message(reason, 'Não foi possível publicar. Atualize as versões antes de tentar novamente.')) }
    finally { operation.current = false }
  }
  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/80">
    <div role="dialog" aria-modal="true" aria-labelledby="version-title" onKeyDown={(event) => {
      if (event.key === 'Escape' && !uploading && !deleting && !publish.isPending && !busy) onClose()
      if (event.key === 'Tab') {
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]'))
        const first = controls[0]; const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }} className="w-full max-w-5xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#343946] bg-[#1A1D24] p-4 sm:p-6 text-[#F8FAFC]">
      <header className="flex gap-3 justify-between"><div><h2 id="version-title" className="text-xl font-bold">Publicar versão V{proximaVersao}</h2><p className="mt-1 text-sm text-[#A8B0C0]">Escolha o vídeo que o cliente vai revisar.</p></div><button ref={closeButton} type="button" disabled={publish.isPending || busy || uploading} onClick={onClose} aria-label="Fechar" className="h-11 w-11 shrink-0 rounded-lg bg-[#242832]">×</button></header>
      {!emEdicao && <p role="status" className="mt-4 text-sm text-amber-300">O projeto precisa estar em edição para enviar ou publicar uma versão.</p>}
      <nav role="tablist" aria-label="Origem do vídeo" className="mt-5 flex border-b border-[#343946]">{(['upload', 'library'] as const).map((tab, index) => <button key={tab} id={`video-tab-${tab}`} type="button" role="tab" aria-selected={mode === tab} aria-controls={`video-panel-${tab}`} tabIndex={mode === tab ? 0 : -1} disabled={publish.isPending || uploading || busy} onClick={() => { setMode(tab); setSearch(''); setError(null) }} onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index
        setMode(next === 0 ? 'upload' : 'library'); setSearch(''); setError(null)
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
      }} className={`relative min-h-12 flex-1 px-3 text-sm transition-colors after:absolute after:bottom-[-1px] after:inset-x-0 after:h-0.5 sm:flex-none sm:px-6 ${mode === tab ? 'font-semibold text-[#C4B5FD] after:bg-[#A78BFA]' : 'text-[#A8B0C0] hover:text-white after:bg-transparent'} disabled:opacity-40`}>{tab === 'upload' ? 'Enviar vídeo' : 'Biblioteca'}</button>)}</nav>
      <section role="tabpanel" id={`video-panel-${mode}`} aria-labelledby={`video-tab-${mode}`} className="mt-4">

        {mode === 'upload' && <>{emEdicao && <UploadDialog key={uploadKey} embedded projetoId={projetoId} onBusyChange={setUploading} onClose={() => {}} onUploaded={(video) => { setSelected(video); setDraftPage(0); setUploadKey((value) => value + 1); void refresh() }} />}{!!list.data?.content.length && <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-[#A8B0C0]">Envios do projeto</h3>}</>}
        {list.isPending && <p role="status" className="py-5 text-sm text-[#A8B0C0]">Carregando vídeos…</p>}
        {list.isError && <div role="alert" className="py-4 text-sm text-red-300">Não foi possível carregar vídeos. <button type="button" onClick={() => void list.refetch()} className="min-h-11 underline">Tentar novamente</button></div>}
        {mode === 'library' && list.data?.content.length === 0 && <p className="py-5 text-sm text-[#A8B0C0]">Sua biblioteca está vazia.</p>}
        {mode === 'library' && <label className="block mt-3 text-xs text-[#A8B0C0]">Buscar nesta página<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar vídeo…" className="mt-2 min-h-11 w-full rounded-lg border border-[#343946] bg-[#12151C] px-3 text-sm" /></label>}
        {search.trim() && list.data && !list.data.content.some((video) => video.nome.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) && <p role="status" className="mt-3 text-sm text-[#A8B0C0]">Nenhum resultado nesta página. Tente outro nome ou navegue pelas páginas.</p>}
        <ul className="mt-3 space-y-2">{list.data?.content.filter((video) => mode !== 'library' || video.nome.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).map((video) => <li key={video.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${selected?.id === video.id ? 'border-[#A78BFA] bg-[#8B5CF6]/10' : 'border-[#343946]'}`}>
          <button type="button" disabled={!['PRONTO', 'PROCESSANDO'].includes(video.status) || publish.isPending || uploading || busy} onClick={() => setSelected(video)} aria-pressed={selected?.id === video.id} className="flex items-center gap-3 min-w-0 min-h-11 flex-1 text-left disabled:opacity-60"><VideoThumbnail video={video} compact /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{video.nome}</span><span className="mt-1 block text-xs text-[#A8B0C0]">{video.status === 'PRONTO' ? 'Pronto para publicar' : video.status === 'PROCESSANDO' ? 'Processando vídeo' : video.status === 'AGUARDANDO_UPLOAD' ? 'Aguardando arquivo' : video.status === 'ERRO' ? 'Erro no processamento' : video.status === 'EXCLUIDO' ? 'Excluído' : 'Preparando vídeo'}{video.orientacao ? ` · ${video.orientacao}` : ''}{video.largura && video.altura ? ` · ${video.largura} × ${video.altura}` : ''}</span></span><span aria-hidden="true" className={`mr-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs ${selected?.id === video.id ? 'border-[#A78BFA] bg-[#8B5CF6] text-white' : 'border-[#667085]'}`}>{selected?.id === video.id ? '✓' : ''}</span></button>
          {video.status !== 'EXCLUIDO' && <button type="button" disabled={publish.isPending || busy || uploading} onClick={() => { setError(null); setDeleting(video) }} className="min-h-11 px-3 text-xs text-red-300" aria-label={`Excluir ${video.nome}`}>Excluir</button>}
        </li>)}</ul>
        {list.data && list.data.totalPages > 1 && <nav aria-label="Paginação de vídeos" className="mt-3 flex items-center justify-between gap-2 text-xs"><button type="button" disabled={list.data.first} onClick={() => { setSearch(''); if (mode === 'library') setPage((p) => p - 1); else setDraftPage((p) => p - 1) }} className="min-h-11 px-3 rounded-lg bg-[#242832] disabled:opacity-40">Anterior</button><span>{list.data.number + 1} / {list.data.totalPages}</span><button type="button" disabled={list.data.last} onClick={() => { setSearch(''); if (mode === 'library') setPage((p) => p + 1); else setDraftPage((p) => p + 1) }} className="min-h-11 px-3 rounded-lg bg-[#242832] disabled:opacity-40">Próxima</button></nav>}
      </section>
      {error && !deleting && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      {candidate && <aside className="mt-4 rounded-xl border border-[#8B5CF6]/50 bg-[#12151C] p-3" aria-live="polite"><div className="flex items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-semibold">Selecionado: {candidate.nome}</p><button type="button" disabled={publish.isPending || uploading} onClick={() => setSelected(null)} className="min-h-11 px-3 text-xs text-[#A78BFA]">Limpar</button></div><p className="text-xs text-[#A8B0C0]">{candidate.status === 'PRONTO' ? 'Pronto para revisão.' : candidate.status === 'PROCESSANDO' ? 'Processando… Você pode voltar ao projeto e publicar depois.' : 'Este vídeo ainda não está disponível para publicação.'}</p>{selectedVideo.isError && <button type="button" onClick={() => void selectedVideo.refetch()} className="min-h-11 text-sm text-amber-300">Não foi possível atualizar. Tentar novamente</button>}</aside>}
      <footer className="sticky bottom-0 bg-[#1A1D24] mt-5 border-t border-[#343946] pt-4 flex gap-3"><button type="button" disabled={publish.isPending || busy || uploading} onClick={onClose} className="min-h-11 flex-1 rounded-lg bg-[#242832] text-sm">Fechar</button><button type="button" onClick={() => void submit()} disabled={!emEdicao || !canPublish || publish.isPending || busy || uploading || !!deleting} className="min-h-11 flex-1 rounded-lg bg-[#8B5CF6] disabled:opacity-40 text-sm font-semibold">{publish.isPending ? 'Publicando…' : 'Publicar versão'}</button></footer>
      {deleting && <section aria-label="Confirmar exclusão" className="mt-4 rounded-xl border border-red-400/40 bg-[#12151C] p-4"><p className="text-sm">Excluir “{deleting.nome}”? Vídeos publicados são protegidos.</p>{error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}<div className="mt-3 flex gap-3"><button type="button" disabled={busy} onClick={() => { setDeleting(null); setError(null) }} className="min-h-11 rounded-lg bg-[#242832] px-4 text-sm">Cancelar</button><button type="button" disabled={busy} onClick={() => void remove()} className="min-h-11 rounded-lg bg-red-600 px-4 text-sm">{busy ? 'Excluindo…' : 'Confirmar exclusão'}</button></div></section>}
    </div>
  </div>
}
