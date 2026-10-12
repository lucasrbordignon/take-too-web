import { versaoMaisRecente } from '../utils/versoes.ts'
import { useState, useMemo } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useProjeto } from '../hooks/useProjetos.ts'
import { useVersoes } from '../hooks/useVersoes.ts'
import { useComentarios, useCriarComentario } from '../hooks/useComentarios.ts'
import { VersionVideoPlayer } from '../components/VersionVideoPlayer.tsx'
import { useToast } from '../context/useToast.ts'
import { authService } from '../services/auth.service.ts'

export function VersaoDetalhesPage() {
  const { projetoId, versaoId } = useParams<{ projetoId: string; versaoId: string }>()
  const [searchParams] = useSearchParams()
  const toast = useToast()

  // Extrai parâmetro de timecode da URL (?t=138)
  const initialTimeFromUrl = useMemo(() => {
    const tParam = searchParams.get('t')
    if (!tParam) return undefined
    const parsed = parseInt(tParam, 10)
    return isNaN(parsed) || parsed < 0 ? undefined : parsed
  }, [searchParams])

  const { data: projeto, isLoading: isProjetoLoading } = useProjeto(projetoId)
  const { data: versoes, isLoading: isVersoesLoading } = useVersoes(projetoId)
  const {
    data: comentarios,
    isLoading: isComentariosLoading,
    isError: isComentariosError,
    refetch: refetchComentarios,
  } = useComentarios(versaoId)

  const { mutate: criarComentario, isPending: isSavingComentario } = useCriarComentario(versaoId)

  const [currentTime, setCurrentTime] = useState(initialTimeFromUrl || 0)
  const [totalDuration, setTotalDuration] = useState(272)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [frozenTime, setFrozenTime] = useState(0)
  const [notaTexto, setNotaTexto] = useState('')
  const [isCopyingLink, setIsCopyingLink] = useState(false)

  // Encontra a versão ativa pelo versaoId ou fallback para a última
  const versaoAtiva = useMemo(() => {
    if (!versoes || versoes.length === 0) return null
    return versoes.find((v) => v.id === versaoId) || versaoMaisRecente(versoes)
  }, [versoes, versaoId])

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Prepara marcadores de comentários para o player
  const videoMarkers = useMemo(() => {
    if (!comentarios) return []
    return comentarios.map((c) => ({
      id: c.id || `comment-${c.timestampSegundos}`,
      timestampSec: c.timestampSegundos ?? 0,
      label: c.texto,
    }))
  }, [comentarios])

  // Abre formulário congelando o segundo atual
  const handleOpenAddNote = () => {
    setFrozenTime(currentTime)
    setIsAddingNote(true)
  }

  // Envia anotação do profissional
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = notaTexto.trim()
    if (!trimmed) {
      toast.error('O comentário não pode ser vazio.')
      return
    }

    criarComentario(
      {
        texto: trimmed,
        tempoVideo: frozenTime,
      },
      {
        onSuccess: () => {
          toast.success('Comentário adicionado com sucesso!')
          setNotaTexto('')
          setIsAddingNote(false)
        },
        onError: () => {
          toast.error('Erro ao adicionar comentário.')
        },
      }
    )
  }

  // Clica no timecode de um comentário
  const handleCommentTimecodeClick = (sec: number, commentId?: string) => {
    setCurrentTime(sec)
    if (commentId) {
      setHighlightedCommentId(commentId)
      setTimeout(() => setHighlightedCommentId(null), 3000)
    }
  }

  // Copia o Magic Link do projeto
  const handleCopyMagicLink = async () => {
    if (!projetoId || projetoId === 'demo') return
    setIsCopyingLink(true)
    try {
      const res = await authService.magicLink({ projetoId })
      if (res.token) {
        const url = `${window.location.origin}/portal/projetos/${projetoId}?token=${res.token}`
        await navigator.clipboard.writeText(url)
        toast.success('Magic Link copiado para a área de transferência!')
      }
    } catch {
      toast.error('Não foi possível gerar o link de compartilhamento.')
    } finally {
      setIsCopyingLink(false)
    }
  }

  const versaoStatus = versaoAtiva?.status || 'DISPONIVEL'
  const isApproved = versaoStatus === 'APROVADA'
  const isRejected = versaoStatus === 'REJEITADA'
  const statusBadgeBg = isApproved
    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
    : isRejected
    ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
    : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-150">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-3">
        <div>
          <Link
            to={`/projetos/${projetoId || ''}`}
            className="text-[13px] leading-[16px] font-semibold text-[#A78BFA] hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Voltar para {projeto?.nome || 'Projeto'}</span>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#F8FAFC] tracking-tight">
              {projeto?.nome || 'Campanha'}
            </h1>

            <div className="h-6 w-[1px] bg-[#343946] hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-[8px] bg-[#312E81] text-[#F8FAFC] font-semibold text-[12px]">
                {versaoAtiva ? `V${versaoAtiva.numero}` : 'V1'}
              </span>
              <span className="text-[14px] font-medium text-[#D7DAE0]">
                {versaoAtiva?.numero === 1 ? 'Primeiro corte' : 'Corte preliminar'}
              </span>
            </div>

            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadgeBg}`}>
              {versaoStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={isCopyingLink}
              onClick={handleCopyMagicLink}
              className="h-[40px] px-4 rounded-[10px] bg-[#242832] hover:bg-[#2E3440] disabled:opacity-50 text-[#E2E5EA] text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-[#343946]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{isCopyingLink ? 'Gerando Link...' : 'Copiar Magic Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Video (8 cols) & Right Comments (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Pro Video Player (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <VersionVideoPlayer
            versao={versaoAtiva}
            projetoId={projetoId}
            fallbackTitle={projeto?.nome || 'VÍDEO DE REVISÃO'}
            markers={videoMarkers}
            currentTime={currentTime}
            totalDuration={totalDuration}
            initialSeekTime={initialTimeFromUrl}
            onTimeUpdate={setCurrentTime}
            onDurationChange={setTotalDuration}
          />
        </div>

        {/* Right Column: Comments & Annotation Panel (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-4 bg-[#1A1D24] border border-[#2E3440] rounded-[16px] p-5 shadow-xl">
          {/* Comments Panel Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#2E3440]">
            <div>
              <h2 className="text-[16px] font-bold text-[#F8FAFC]">
                Comentários e Ajustes
              </h2>
              <span className="text-[11px] text-[#A8B0C0]">
                {comentarios?.length || 0} anotações registradas
              </span>
            </div>

            {!isAddingNote && (
              <button
                type="button"
                onClick={handleOpenAddNote}
                className="h-[34px] px-3 rounded-[8px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-purple-900/20"
              >
                <span>＋</span>
                <span>Nota em {formatTimecode(currentTime)}</span>
              </button>
            )}
          </div>

          {/* Add Note Form (quando ativado) */}
          {isAddingNote && (
            <form
              onSubmit={handleSaveNote}
              className="bg-[#12151C] border border-[#8B5CF6]/50 rounded-[12px] p-4 flex flex-col gap-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A78BFA] uppercase tracking-wider flex items-center gap-1.5">
                  <span>⏱</span>
                  <span>Congelado em {formatTimecode(frozenTime)}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="text-[#A8B0C0] hover:text-white text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <textarea
                rows={3}
                required
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
                placeholder="Escreva sua anotação ou orientação de edição..."
                className="w-full bg-[#1A1D24] border border-[#2E3440] rounded-[8px] p-2.5 text-[13px] text-[#F8FAFC] placeholder-[#667085] outline-none focus:border-[#8B5CF6] transition-colors resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNote(false)
                    setNotaTexto('')
                  }}
                  className="px-3 py-1.5 rounded-[6px] text-[#A8B0C0] hover:text-white text-[12px] cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  disabled={isSavingComentario}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  {isSavingComentario ? 'Salvando...' : 'Adicionar comentário'}
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
            {isComentariosLoading || isProjetoLoading || isVersoesLoading ? (
              <div className="flex flex-col gap-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-[#12151C] rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : isComentariosError ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <p className="text-[13px] text-[#EF4444]">Erro ao carregar comentários.</p>
                <button
                  type="button"
                  onClick={() => refetchComentarios()}
                  className="px-3 py-1 bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] text-[12px] rounded-[6px] cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            ) : !comentarios || comentarios.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#242832] flex items-center justify-center text-[#788194]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#F8FAFC]">
                    Nenhum comentário encontrado
                  </h3>
                  <p className="text-[13px] text-[#788194] mt-1 max-w-xs mx-auto">
                    Os feedbacks deixados pelo cliente no Magic Link ou anotações que você criar aparecerão aqui ordenados pelo timecode.
                  </p>
                </div>
              </div>
            ) : (
              comentarios.map((c) => {
                const sec = c.timestampSegundos ?? 0
                const isSelected = currentTime === sec || highlightedCommentId === c.id
                const isClient = c.autorTipo === 'CLIENTE'

                return (
                  <div
                    key={c.id || `com-${sec}`}
                    onClick={() => handleCommentTimecodeClick(sec, c.id)}
                    className={`rounded-[12px] p-3.5 flex flex-col gap-2 cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#24213A] border-[#8B5CF6]/80 shadow-md shadow-purple-900/30'
                        : 'bg-[#12151C] border-[#2E3440] hover:border-[#3E4556]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Timecode Badge */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCommentTimecodeClick(sec, c.id)
                        }}
                        className={`h-[24px] px-2 rounded-[6px] font-mono text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#8B5CF6] text-white'
                            : 'bg-[#242832] text-[#A78BFA] hover:bg-[#8B5CF6]/20'
                        }`}
                      >
                        <span>⏱</span>
                        <span>{formatTimecode(sec)}</span>
                      </button>

                      {/* Author Tag */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          isClient
                            ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                            : 'bg-[#6366F1]/15 text-[#C4B5FD] border-[#6366F1]/30'
                        }`}
                      >
                        {isClient ? 'Cliente' : 'Profissional'}
                      </span>
                    </div>

                    <p className="text-[13px] leading-relaxed text-[#E2E5EA]">
                      {c.texto}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
