import { useEffect, useRef } from 'react'

interface Props {
  timestamp: number | null
  text: string
  busy: boolean
  error: string | null
  onTextChange: (text: string) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function FeedbackOverlay({ timestamp, text, busy, error, onTextChange, onClose, onSubmit }: Props) {
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    input.current?.focus({ preventScroll: true })
    return () => previous?.focus({ preventScroll: true })
  }, [])
  const timecode = timestamp === null ? null : `${String(Math.floor(timestamp / 60)).padStart(2, '0')}:${String(timestamp % 60).padStart(2, '0')}`
  return <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-6">
    <aside role="dialog" aria-modal={false} aria-labelledby="feedback-overlay-title" onKeyDown={(event) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose() }
    }} className="pointer-events-auto w-full max-h-[70dvh] overflow-y-auto rounded-2xl border border-[#454052] bg-[#1A1D24] p-4 shadow-2xl sm:max-w-[400px] sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div><h2 id="feedback-overlay-title" className="text-base font-semibold text-[#F8FAFC]">Adicionar feedback</h2><p className="mt-1 text-xs text-[#A8B0C0]">{timestamp === null ? 'Seu feedback fica vinculado a esta imagem.' : 'O vídeo continua tocando. O instante do comentário fica fixado.'}</p></div>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Fechar feedback" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-xl text-[#A8B0C0] hover:bg-[#242832] disabled:opacity-40">×</button>
      </header>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        {timecode && <p className="inline-flex rounded-md bg-[#8B5CF6]/15 px-2.5 py-1.5 text-xs font-medium text-[#C4B5FD]">Comentário em <span className="ml-1.5 font-mono tabular-nums">{timecode}</span></p>}
        <label className="block"><span className="sr-only">Seu feedback</span><textarea ref={input} required disabled={busy} rows={4} value={text} onChange={(event) => onTextChange(event.target.value)} placeholder="O que precisa mudar neste momento?" className="w-full resize-y rounded-xl border border-[#343946] bg-[#12151C] p-3 text-sm text-[#F8FAFC] outline-none placeholder:text-[#788194] focus:border-[#A78BFA] disabled:opacity-60" /></label>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <footer className="flex gap-2"><button type="button" disabled={busy} onClick={onClose} className="min-h-11 flex-1 rounded-lg bg-[#242832] text-sm text-[#E2E5EA] disabled:opacity-40">Fechar</button><button type="submit" disabled={busy || !text.trim()} className="min-h-11 flex-1 rounded-lg bg-[#8B5CF6] text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Enviando…' : 'Enviar comentário'}</button></footer>
      </form>
    </aside>
  </div>
}
