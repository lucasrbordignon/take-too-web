import { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { StatusVideo, VideoDTO, VideoUploadDTO } from '../api/types.ts'
import { StreamingVideoPlayer } from '../components/videos/StreamingVideoPlayer.tsx'
import { useCriarVideoUpload, useExcluirVideo, useSincronizarVideo, useVideos } from '../hooks/useVideos.ts'
import { UploadNetworkError, uploadVideoDirectly } from '../lib/directVideoUpload.ts'
import { videosService } from '../services/videos.service.ts'

const terminalStatuses: StatusVideo[] = ['PRONTO', 'ERRO', 'CANCELADO', 'EXCLUIDO']

const statusLabels: Record<StatusVideo, string> = {
  CRIANDO_UPLOAD: 'Preparando envio', AGUARDANDO_UPLOAD: 'Aguardando envio', PROCESSANDO: 'Processando', PRONTO: 'Pronto', ERRO: 'Erro', CANCELADO: 'Cancelado', EXCLUIDO: 'Excluído',
}
const statusColors: Record<StatusVideo, string> = {
  CRIANDO_UPLOAD: 'bg-amber-500/15 text-amber-300', AGUARDANDO_UPLOAD: 'bg-indigo-500/15 text-indigo-300', PROCESSANDO: 'bg-amber-500/15 text-amber-300', PRONTO: 'bg-emerald-500/15 text-emerald-300', ERRO: 'bg-red-500/15 text-red-300', CANCELADO: 'bg-slate-500/15 text-slate-300', EXCLUIDO: 'bg-slate-500/15 text-slate-300',
}
function bytes(value: number) { return value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB` }
function duration(value: number | null) { return value == null ? null : `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` }
function isExpired(error: unknown) { return error instanceof AxiosError && error.response?.status === 401 }

export function VideosPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, error, refetch } = useVideos(page)
  const sync = useSincronizarVideo()
  const remove = useExcluirVideo()
  const [selected, setSelected] = useState<VideoDTO | null>(null)
  const [deleting, setDeleting] = useState<VideoDTO | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const syncing = useRef(false)

  const pendingVideos = useMemo(() => data?.content.filter((v) => !terminalStatuses.includes(v.status)) ?? [], [data])
  useEffect(() => {
    if (!pendingVideos.length || syncing.current) return
    let stopped = false
    let timeout: number | undefined
    let delay = 4000
    const poll = async () => {
      if (stopped || syncing.current) return
      syncing.current = true
      try { await Promise.all(pendingVideos.map((video) => sync.mutateAsync(video.id))); delay = Math.min(delay * 1.5, 15000) }
      catch { delay = Math.min(delay * 2, 30000) }
      finally { syncing.current = false; if (!stopped) timeout = window.setTimeout(() => void poll(), delay) }
    }
    timeout = window.setTimeout(() => void poll(), delay)
    return () => { stopped = true; if (timeout) window.clearTimeout(timeout) }
  }, [pendingVideos, sync])

  const onDelete = async () => {
    if (!deleting) return
    await remove.mutateAsync(deleting.id)
    setDeleting(null)
  }

  return <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-10">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div><h1 className="text-[28px] leading-tight font-bold tracking-tight">Vídeos</h1><p className="mt-1.5 text-sm text-[#A8B0C0]">Envie e acompanhe vídeos sem alterar seus projetos.</p></div>
      <button type="button" onClick={() => setNewOpen(true)} className="h-11 w-full sm:w-auto px-4 rounded-[10px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-sm shadow-lg shadow-purple-600/25">+ Enviar vídeo</button>
    </div>
    {isLoading && <State icon="◌" title="Carregando vídeos…" />}
    {isError && <State icon="!" title={isExpired(error) ? 'Sua sessão expirou.' : 'Não foi possível carregar seus vídeos.'} action="Tentar novamente" onAction={() => void refetch()} />}
    {!isLoading && !isError && data?.content.length === 0 && <State icon="▶" title="Sua biblioteca está vazia" text="Envie um vídeo para preparar sua visualização privada." action="Enviar vídeo" onAction={() => setNewOpen(true)} />}
    {!isLoading && !isError && !!data?.content.length && <><section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4" aria-label="Biblioteca de vídeos">
      {data.content.map((video) => <VideoCard key={video.id} video={video} onPlay={() => setSelected(video)} onSync={() => void sync.mutateAsync(video.id)} onDelete={() => setDeleting(video)} isSyncing={sync.isPending} />)}
    </section>
    <nav className="flex items-center justify-between gap-3 text-sm text-[#A8B0C0]" aria-label="Paginação"><span>Página {page + 1} de {Math.max(data.totalPages, 1)}</span><div className="flex gap-2"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="h-10 px-3 rounded-lg bg-[#242832] disabled:opacity-40">Anterior</button><button type="button" disabled={data.last} onClick={() => setPage((value) => value + 1)} className="h-10 px-3 rounded-lg bg-[#242832] disabled:opacity-40">Próxima</button></div></nav></>}
    {newOpen && <UploadDialog onClose={() => setNewOpen(false)} onUploaded={() => void refetch()} />}
    {selected && <StreamingVideoPlayer video={selected} onClose={() => setSelected(null)} />}
    {deleting && <ConfirmDelete video={deleting} busy={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => void onDelete()} />}
  </div>
}

function State({ icon, title, text, action, onAction }: { icon: string; title: string; text?: string; action?: string; onAction?: () => void }) { return <section className="min-h-72 rounded-2xl border border-[#343946]/60 bg-[#1A1D24] grid place-items-center p-6 text-center"><div><div className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-full bg-[#242832] text-xl text-[#A78BFA]">{icon}</div><h2 className="font-bold">{title}</h2>{text && <p className="mt-1 text-sm text-[#A8B0C0]">{text}</p>}{action && <button type="button" onClick={onAction} className="mt-4 h-10 px-4 rounded-lg bg-[#8B5CF6] font-semibold text-sm">{action}</button>}</div></section> }

function VideoCard({ video, onPlay, onSync, onDelete, isSyncing }: { video: VideoDTO; onPlay: () => void; onSync: () => void; onDelete: () => void; isSyncing: boolean }) { const info = [duration(video.duracaoSegundos), video.largura && video.altura ? `${video.largura} × ${video.altura}` : null, video.orientacao].filter(Boolean).join(' · '); return <article className="min-w-0 rounded-2xl border border-[#343946]/60 bg-[#1A1D24] p-4 flex flex-col gap-4"><div className="aspect-video rounded-xl bg-[#11141C] border border-[#343946]/30 flex items-center justify-center text-[#667085]" aria-hidden="true">▶</div><div className="min-w-0"><div className="flex gap-2 items-start justify-between"><h2 className="font-semibold text-[#F8FAFC] truncate">{video.nome}</h2><span className={`shrink-0 px-2 py-1 rounded-full text-[11px] font-semibold ${statusColors[video.status]}`}>{statusLabels[video.status]}</span></div>{info && <p className="mt-1 text-xs text-[#A8B0C0]">{info}</p>}{video.erro && <p className="mt-2 text-xs text-red-300" role="status">{video.erro}</p>}</div><div className="grid grid-cols-2 gap-2 mt-auto">{video.status === 'PRONTO' ? <button type="button" onClick={onPlay} className="h-11 rounded-lg bg-[#8B5CF6] font-semibold text-sm">Reproduzir</button> : <button type="button" onClick={onSync} disabled={isSyncing || terminalStatuses.includes(video.status)} className="h-11 rounded-lg bg-[#242832] disabled:opacity-40 text-sm font-semibold">Atualizar</button>}<button type="button" onClick={onDelete} className="h-11 rounded-lg border border-[#343946] text-sm text-[#E2E5EA]">Excluir</button></div></article> }

function UploadDialog({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const create = useCriarVideoUpload(); const [file, setFile] = useState<File | null>(null); const [name, setName] = useState(''); const [preview, setPreview] = useState<string | null>(null); const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null); const [error, setError] = useState<string | null>(null); const [isUploading, setIsUploading] = useState(false); const direct = useRef<ReturnType<typeof uploadVideoDirectly> | null>(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); direct.current?.cancel() }, [preview])
  const choose = useCallback((next: File | null) => { if (preview) URL.revokeObjectURL(preview); setFile(next); setName(next ? next.name : ''); setPreview(next && next.type.startsWith('video/') ? URL.createObjectURL(next) : null); setError(null) }, [preview])
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!file || !name.trim()) return; setError(null); try { const session: VideoUploadDTO = await create.mutateAsync({ nome: name.trim(), origem: window.location.origin }); direct.current = uploadVideoDirectly(session, file, (loaded, total) => setProgress({ loaded, total })); setIsUploading(true); await direct.current.done; await videosService.sincronizar(session.video.id).catch(() => undefined); onUploaded(); onClose() } catch (reason) { if ((reason as DOMException).name === 'AbortError') return; setError(reason instanceof UploadNetworkError ? reason.message : 'O envio não foi concluído. A criação não será repetida automaticamente; atualize a biblioteca para verificar o estado.') } finally { direct.current = null; setIsUploading(false) } }
  const sending = create.isPending || isUploading
  return <div className="fixed inset-0 z-50 bg-black/75 p-3 sm:p-6 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="upload-title"><form onSubmit={submit} className="w-full max-w-4xl rounded-2xl bg-[#1A1D24] border border-[#343946] p-5 sm:p-8 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 id="upload-title" className="text-xl font-bold">Enviar vídeo</h2><p className="mt-1 text-sm text-[#A8B0C0]">O envio prepara o vídeo para visualização privada.</p></div><button type="button" disabled={sending} onClick={onClose} aria-label="Fechar" className="w-11 h-11 rounded-lg hover:bg-[#242832]">×</button></div><div className="mt-5"><span className="text-sm font-medium">Arquivo de vídeo</span><input id="video-file" type="file" accept="video/*" onChange={(e) => choose(e.target.files?.[0] ?? null)} className="sr-only" /><label htmlFor="video-file" aria-disabled={sending} className={`mt-2 min-h-32 w-full rounded-xl border border-dashed border-[#667085] bg-[#12151C] px-4 text-center text-sm text-[#E2E5EA] hover:border-[#A78BFA] hover:bg-[#242832] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#A78BFA] flex flex-col justify-center ${sending ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}><span className="block font-semibold">Selecionar vídeo</span><span className="mt-1 block text-xs text-[#A8B0C0]">Galeria ou arquivos do dispositivo</span></label></div>{file && <div className="mt-3 rounded-xl bg-[#12151C] p-3 text-sm"><p className="truncate text-[#F8FAFC]">{file.name}</p><p className="mt-1 text-[#A8B0C0]">{bytes(file.size)}</p>{preview && <video src={preview} muted playsInline controls className="mt-3 max-h-72 w-full rounded-lg object-contain" />}</div>}<label className="block mt-4"><span className="text-sm font-medium">Nome do vídeo</span><input required maxLength={255} value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full h-11 rounded-lg border border-[#343946] bg-[#12151C] px-3 text-sm outline-none focus:border-[#A78BFA]" /></label>{progress && <div className="mt-4" role="status"><div className="flex justify-between text-xs text-[#A8B0C0]"><span>Enviando arquivo</span><span>{bytes(progress.loaded)} de {bytes(progress.total)}</span></div><div className="mt-2 h-2 rounded-full bg-[#343946] overflow-hidden"><div className="h-full bg-[#8B5CF6]" style={{ width: `${Math.round(progress.loaded / progress.total * 100)}%` }} /></div><button type="button" onClick={() => { direct.current?.cancel(); setIsUploading(false) }} className="mt-2 text-sm text-[#FCA5A5]">Cancelar envio</button></div>}{create.isPending && <p className="mt-4 text-sm text-[#A8B0C0]" role="status">Criando sessão de envio…</p>}{error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}<button disabled={!file || !name.trim() || sending} className="mt-6 w-full h-11 rounded-lg bg-[#8B5CF6] disabled:opacity-50 font-semibold text-sm">{sending ? 'Enviando…' : 'Iniciar envio'}</button></form></div>
}

function ConfirmDelete({ video, busy, onCancel, onConfirm }: { video: VideoDTO; busy: boolean; onCancel: () => void; onConfirm: () => void }) { return <div className="fixed inset-0 z-[60] bg-black/75 p-4 grid place-items-center" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="w-full max-w-sm rounded-2xl bg-[#1A1D24] border border-[#343946] p-5"><h2 id="delete-title" className="text-lg font-bold">Excluir vídeo?</h2><p className="mt-2 text-sm text-[#A8B0C0]">“{video.nome}” será removido e ficará indisponível.</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={onCancel} className="h-11 rounded-lg bg-[#242832] font-semibold">Cancelar</button><button type="button" disabled={busy} onClick={onConfirm} className="h-11 rounded-lg bg-[#DC2626] font-semibold disabled:opacity-50">{busy ? 'Excluindo…' : 'Excluir'}</button></div></div></div> }
