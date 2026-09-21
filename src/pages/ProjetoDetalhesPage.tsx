import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjeto, useAtualizarStatusProjeto, useRevogarMagicLink } from '../hooks/useProjetos.ts'
import { useVersoes } from '../hooks/useVersoes.ts'
import { useAtividades } from '../hooks/useAtividades.ts'
import { authService } from '../services/auth.service.ts'
import { NovaVersaoModal } from '../components/NovaVersaoModal.tsx'
import { MagicLinkModal } from '../components/shared/MagicLinkModal.tsx'
import { ConfirmRevocationDialog } from '../components/shared/ConfirmRevocationDialog.tsx'
import { ConfirmStageModal, type StageModalType } from '../components/shared/ConfirmStageModal.tsx'
import { useToast } from '../context/useToast.ts'
import { formatRelativeTime } from '../utils/date.ts'
import type { StatusProjeto } from '../api/types.ts'

const STAGES: { id: StatusProjeto }[] = [
  { id: 'GRAVACAO_CONCLUIDA' },
  { id: 'EM_EDICAO' },
  { id: 'REVISAO_CLIENTE' },
  { id: 'APROVADO' },
  { id: 'ENTREGUE' },
]



export function ProjetoDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const { data: realProjeto, isLoading: isLoadingProjeto, isError: isErrorProjeto } = useProjeto(id)
  const { data: realVersoes } = useVersoes(id)
  const { data: realAtividades = [], isLoading: carregandoAtividades } = useAtividades(id)
  const { mutate: atualizarStatus, isPending: isUpdatingStatus } = useAtualizarStatusProjeto()
  const { mutate: revogarLink, isPending: isRevoking } = useRevogarMagicLink()
  const toast = useToast()

  const [isNovaVersaoOpen, setIsNovaVersaoOpen] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false)
  const [linkStatus, setLinkStatus] = useState<'ATIVO' | 'REVOGADO' | 'NAO_GERADO'>('ATIVO')
  const [currentMagicLinkUrl, setCurrentMagicLinkUrl] = useState('')

  // Modais de confirmação e regras de etapas
  const [isStageModalOpen, setIsStageModalOpen] = useState(false)
  const [stageModalType, setStageModalType] = useState<StageModalType>('CONFIRM_CHANGE')
  const [pendingTargetStage, setPendingTargetStage] = useState<StatusProjeto | null>(null)
  const [localEtapa, setLocalEtapa] = useState<StatusProjeto | null>(null)

  // Project data
  const projeto = useMemo(() => {
    return {
      id: id || '',
      nome: realProjeto?.nome || 'Carregando projeto...',
      clienteNome: realProjeto?.cliente?.nome || 'Sem cliente vinculado',
      clienteEmail: realProjeto?.cliente?.email || 'Sem e-mail cadastrado',
      clienteTelefone: realProjeto?.cliente?.telefone || 'Sem telefone cadastrado',
      etapaAtual: (localEtapa || realProjeto?.etapaAtual || 'EM_EDICAO') as StatusProjeto,
    }
  }, [id, realProjeto, localEtapa])

  // Resolve activities: real from API
  const displayAtividades = useMemo(() => {
    return realAtividades || []
  }, [realAtividades])

  // Current stage index
  const currentStageIndex = useMemo(() => {
    const idx = STAGES.findIndex((s) => s.id === projeto.etapaAtual)
    return idx >= 0 ? idx : 2 // Default to "Revisão do cliente"
  }, [projeto.etapaAtual])

  const isApprovedOrDelivered = projeto.etapaAtual === 'APROVADO' || projeto.etapaAtual === 'ENTREGUE'

  const effectiveLinkStatus = isApprovedOrDelivered
    ? 'REVOGADO'
    : realProjeto?.magicLinkAtivo !== undefined
    ? realProjeto.magicLinkAtivo ? 'ATIVO' : 'REVOGADO'
    : linkStatus

  // Labels dinâmicas com tempo/estado
  const getDynamicStageLabel = (stageId: StatusProjeto, isCompleted: boolean, isCurrent: boolean) => {
    if (stageId === 'APROVADO') {
      return isCompleted || isCurrent ? 'Aprovado' : 'Pendente aprovação'
    }
    if (stageId === 'ENTREGUE') {
      return isCurrent ? 'Entregue' : 'Entregar'
    }
    if (stageId === 'GRAVACAO_CONCLUIDA') return 'Gravação concluída'
    if (stageId === 'EM_EDICAO') return 'Em edição'
    if (stageId === 'REVISAO_CLIENTE') return 'Revisão do cliente'
    return stageId
  }

  const handleStageClick = (stageId: StatusProjeto) => {
    if (stageId === projeto.etapaAtual) return

    // 1. Regra para quando o projeto está APROVADO:
    if (projeto.etapaAtual === 'APROVADO') {
      // Bloqueado voltar diretamente para gravação concluída ou em edição
      if (stageId === 'GRAVACAO_CONCLUIDA' || stageId === 'EM_EDICAO') {
        setPendingTargetStage(stageId)
        setStageModalType('LOCKED_STAGE')
        setIsStageModalOpen(true)
        return
      }
      // Se clicar em revisão do cliente -> devolver caso aprovado por engano
      if (stageId === 'REVISAO_CLIENTE') {
        setPendingTargetStage('REVISAO_CLIENTE')
        setStageModalType('REOPEN_REVIEW')
        setIsStageModalOpen(true)
        return
      }
      // Se clicar em entregar -> confirmação de entrega pelo profissional
      if (stageId === 'ENTREGUE') {
        setPendingTargetStage('ENTREGUE')
        setStageModalType('CONFIRM_CHANGE')
        setIsStageModalOpen(true)
        return
      }
    }

    // 2. Regra para quando o projeto está ENTREGUE:
    if (projeto.etapaAtual === 'ENTREGUE') {
      // Pode devolver para revisão do cliente caso tenha sido aprovado/entregue por engano
      if (stageId === 'REVISAO_CLIENTE') {
        setPendingTargetStage('REVISAO_CLIENTE')
        setStageModalType('REOPEN_REVIEW')
        setIsStageModalOpen(true)
        return
      }
      // Demais etapas anteriores (Gravação, Edição ou Aprovado) -> bloqueadas
      setPendingTargetStage(stageId)
      setStageModalType('LOCKED_STAGE')
      setIsStageModalOpen(true)
      return
    }

    // 3. Regra para quando o projeto está em GRAVAÇÃO, EDIÇÃO ou REVISÃO DO CLIENTE:
    // Apenas o cliente pode aprovar formalmente via Magic Link
    if (stageId === 'APROVADO') {
      setPendingTargetStage('APROVADO')
      setStageModalType('CLIENT_APPROVAL_ONLY')
      setIsStageModalOpen(true)
      return
    }

    // Quem entrega é o profissional, mas requer aprovação prévia do cliente
    if (stageId === 'ENTREGUE') {
      setPendingTargetStage('ENTREGUE')
      setStageModalType('DELIVERY_NEEDS_APPROVAL')
      setIsStageModalOpen(true)
      return
    }

    // Onde pode mudar à vontade: Em Edição, Revisão do Cliente e Gravação Concluída
    setPendingTargetStage(stageId)
    setStageModalType('CONFIRM_CHANGE')
    setIsStageModalOpen(true)
  }

  const handleConfirmStageChange = () => {
    if (!pendingTargetStage) return
    const target = pendingTargetStage

    // Regra de revogação de link e encerramento de comentários ao aprovar/entregar
    if (target === 'ENTREGUE' || target === 'APROVADO') {
      setLinkStatus('REVOGADO')
      if (id && id !== 'demo') {
        revogarLink(id)
      }
    } else if (target === 'REVISAO_CLIENTE') {
      setLinkStatus('ATIVO')
    }

    if (!id || id === 'demo' || id === '1') {
      setLocalEtapa(target)
      setIsStageModalOpen(false)
      toast.success(
        target === 'ENTREGUE'
          ? 'Projeto finalizado e marcado como Entregue!'
          : target === 'REVISAO_CLIENTE' && isApprovedOrDelivered
          ? 'Projeto devolvido para Revisão do Cliente! Link reativado.'
          : 'Etapa do projeto alterada com sucesso!'
      )
      return
    }

    atualizarStatus(
      { id, data: { status: target } },
      {
        onSuccess: () => {
          setIsStageModalOpen(false)
          setLocalEtapa(target)
          toast.success(
            target === 'ENTREGUE'
              ? 'Projeto finalizado e marcado como Entregue!'
              : target === 'REVISAO_CLIENTE' && isApprovedOrDelivered
              ? 'Projeto devolvido para Revisão do Cliente! Link reativado.'
              : 'Etapa do projeto alterada com sucesso!'
          )
        },
        onError: () => {
          toast.error('Não foi possível alterar a etapa do projeto.')
        },
      }
    )
  }

  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  const getOrGenerateMagicLink = async (): Promise<string> => {
    let url = `${window.location.origin}/portal/projetos/${id || 'demo'}`
    if (id && id !== 'demo') {
      const res = await authService.magicLink({ projetoId: id })
      if (res.token) {
        url = `${window.location.origin}/portal/projetos/${id}?token=${res.token}`
        setLinkStatus('ATIVO')
      }
    }
    setCurrentMagicLinkUrl(url)
    return url
  }

  const handleCopyLink = async () => {
    setIsGeneratingLink(true)
    try {
      const urlToCopy = await getOrGenerateMagicLink()
      await navigator.clipboard.writeText(urlToCopy)
      setCopiado(true)
      toast.success('Magic Link copiado para a área de transferência!')
      setTimeout(() => setCopiado(false), 2500)
    } catch (err) {
      console.warn('Erro ao gerar magic link:', err)
      toast.error('Não foi possível gerar o link.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleOpenShare = async () => {
    setIsGeneratingLink(true)
    try {
      const url = await getOrGenerateMagicLink()
      setCurrentMagicLinkUrl(url)
      setIsShareModalOpen(true)
    } catch (err) {
      console.warn('Erro ao gerar link para compartilhar:', err)
      toast.error('Erro ao preparar link de compartilhamento.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleConfirmRevoke = () => {
    if (!id || id === 'demo') {
      setLinkStatus('REVOGADO')
      setIsRevokeModalOpen(false)
      toast.success('Magic Link revogado com sucesso!')
      return
    }

    revogarLink(id, {
      onSuccess: () => {
        setLinkStatus('REVOGADO')
        setIsRevokeModalOpen(false)
        toast.success('Acesso do cliente revogado com sucesso!')
      },
      onError: () => {
        toast.error('Erro ao revogar link. Tente novamente.')
      },
    })
  }

  // Version list: real versions
  const versionsList = useMemo(() => {
    if (realVersoes && realVersoes.length > 0) {
      return realVersoes.map((v, idx) => {
        const num = v.numero || realVersoes.length - idx
        const isApproved = v.status === 'APROVADA'
        const isRejected = v.status === 'REJEITADA'
        const statusLabel = isApproved ? 'APROVADO' : isRejected ? 'REJEITADA' : 'PENDENTE'
        const statusBg = isApproved ? 'bg-[#10B981]' : isRejected ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'

        return {
          id: v.id || String(idx),
          numero: num,
          badge: `V${num}`,
          titulo: num === 1 ? 'Primeiro corte' : `Corte versão ${num}`,
          subtitle: v.criadoEm
            ? `Publicado ${formatRelativeTime(v.criadoEm)} · Versão ${num}`
            : `Publicado · Versão ${num}`,
          statusLabel,
          statusBg,
        }
      })
    }

    return []
  }, [realVersoes])

  if (isLoadingProjeto) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center gap-3 text-[#A8B0C0]">
        <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Carregando detalhes do projeto...</span>
      </div>
    )
  }

  if (!realProjeto || isErrorProjeto) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#242832] flex items-center justify-center text-[#788194]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-[#F8FAFC]">Nenhum projeto encontrado</h2>
          <p className="text-[14px] text-[#788194] mt-1">
            O projeto solicitado não foi localizado ou não existe mais.
          </p>
        </div>
        <Link
          to="/projetos"
          className="mt-2 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-[10px] text-[13px] font-semibold transition-all shadow-md cursor-pointer"
        >
          ← Voltar para Projetos
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-12">
      {/* Back Link */}
      <div>
        <Link
          to="/projetos"
          className="text-[13px] leading-[16px] font-semibold text-[#A78BFA] hover:text-white transition-colors inline-flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Projetos</span>
        </Link>
      </div>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[27px] leading-[33px] font-bold text-[#F8FAFC] tracking-tight">
            {projeto.nome}
          </h1>
          <p className="text-[13px] leading-[16px] font-normal text-[#A8B0C0] mt-1.5">
            {projeto.clienteNome} • Atualizado {formatRelativeTime(realProjeto?.atualizadoEm || realProjeto?.criadoEm)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNovaVersaoOpen(true)}
          className="w-full md:w-[212px] h-[42px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#F8FAFC] font-semibold text-[13px] leading-[16px] rounded-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25 active:scale-[0.99] transition-all shrink-0"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>Publicar nova versão</span>
        </button>
      </div>

      {/* Project Progress Stepper: 1104px x 116px, bg: #1A1D24, rounded: 16px */}
      <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] px-6 py-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex
            const isCurrent = idx === currentStageIndex
            const isLast = idx === STAGES.length - 1
            const label = getDynamicStageLabel(stage.id, isCompleted, isCurrent)

            // Tooltip explicativo
            const tooltip =
              (projeto.etapaAtual === 'APROVADO' || projeto.etapaAtual === 'ENTREGUE') &&
              (stage.id === 'GRAVACAO_CONCLUIDA' || stage.id === 'EM_EDICAO')
                ? 'Projeto já finalizado. Bloqueado retornar diretamente para etapas de produção.'
                : (projeto.etapaAtual === 'APROVADO' || projeto.etapaAtual === 'ENTREGUE') &&
                  stage.id === 'REVISAO_CLIENTE'
                ? 'Devolver para revisão do cliente (caso aprovado por engano)'
                : stage.id === 'APROVADO' && !isCompleted && !isCurrent
                ? 'Apenas o cliente pode aprovar através do Magic Link'
                : stage.id === 'ENTREGUE' && currentStageIndex < 3
                ? 'Necessita de aprovação prévia do cliente para entrega'
                : isCurrent
                ? `Etapa atual: ${label}`
                : `Clique para mudar para "${label}"`

            return (
              <div key={stage.id} className="flex items-center flex-1 last:flex-none">
                {/* Circle & Label */}
                <div
                  onClick={() => handleStageClick(stage.id)}
                  className="flex flex-col items-center gap-3 cursor-pointer group shrink-0"
                  title={tooltip}
                >
                  {/* Indicator 26x26 */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110 shadow-sm ${
                      isCompleted
                        ? 'bg-[#10B981] text-[#F8FAFC]'
                        : isCurrent
                        ? 'bg-[#8B5CF6] ring-4 ring-purple-500/20 text-[#F8FAFC]'
                        : 'bg-[#242832] border border-[#343946] text-[#788194]'
                    }`}
                  >
                    {isCompleted && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {isCurrent && <div className="w-2.5 h-2.5 rounded-full bg-white shadow" />}
                    {!isCompleted && !isCurrent && (
                      <span className="text-[11px] font-semibold text-[#A8B0C0]">{idx + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[11px] sm:text-[12px] leading-[14px] text-center whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'font-bold text-[#F8FAFC]'
                        : isCompleted
                        ? 'font-medium text-[#F8FAFC]'
                        : 'font-medium text-[#788194] group-hover:text-[#D7DAE0]'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`h-[2px] flex-1 mx-4 -mt-7 rounded-full transition-colors ${
                      idx < currentStageIndex ? 'bg-[#10B981]' : 'bg-[#343946]'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Magic Link Card: Full width above the 2-column layout */}
      <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] leading-[18px] font-semibold text-[#F8FAFC]">
              Portal de revisão do cliente
            </h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isApprovedOrDelivered
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  : effectiveLinkStatus === 'ATIVO'
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  : effectiveLinkStatus === 'REVOGADO'
                  ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                  : 'bg-[#6B7280]/15 text-[#9CA3AF] border-[#6B7280]/30'
              }`}
            >
              {isApprovedOrDelivered
                ? projeto.etapaAtual === 'ENTREGUE'
                  ? 'Projeto entregue · Link encerrado'
                  : 'Aprovado pelo cliente · Link encerrado'
                : effectiveLinkStatus === 'ATIVO'
                ? 'Link ativo'
                : effectiveLinkStatus === 'REVOGADO'
                ? 'Acesso revogado'
                : 'Não compartilhado'}
            </span>
          </div>
          <p className="text-[12px] leading-[15px] font-medium text-[#A8B0C0]">
            {isApprovedOrDelivered
              ? 'O link foi revogado com o encerramento das revisões e novos comentários foram desabilitados.'
              : effectiveLinkStatus === 'ATIVO'
              ? 'O cliente não precisa de senha para acessar e revisar.'
              : effectiveLinkStatus === 'REVOGADO'
              ? 'O link anterior foi desativado. Gere um novo para liberar o acesso.'
              : 'Gere um Magic Link para que o cliente revise as versões.'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          {isApprovedOrDelivered ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setPendingTargetStage('REVISAO_CLIENTE')
                  setStageModalType('REOPEN_REVIEW')
                  setIsStageModalOpen(true)
                }}
                className="h-[40px] px-4 bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#F59E0B] border border-[#F59E0B]/30 rounded-[10px] font-semibold text-[13px] leading-[16px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
                title="Reabre o projeto para revisão caso o cliente tenha aprovado por engano"
              >
                <span>↩ Devolver para revisão</span>
              </button>

              <button
                type="button"
                disabled={isGeneratingLink}
                onClick={handleCopyLink}
                className="h-[40px] px-3.5 bg-[#242832] hover:bg-[#2E3440] disabled:opacity-50 border border-[#343946]/50 rounded-[10px] font-semibold text-[13px] leading-[16px] text-[#F8FAFC] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
                title="Copiar link do portal para consulta"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{copiado ? 'Copiado!' : 'Copiar link'}</span>
              </button>
            </>
          ) : effectiveLinkStatus !== 'REVOGADO' ? (
            <>
              <button
                type="button"
                disabled={isGeneratingLink}
                onClick={handleCopyLink}
                className="h-[40px] px-3.5 bg-[#242832] hover:bg-[#2E3440] disabled:opacity-50 border border-[#343946]/50 rounded-[10px] font-semibold text-[13px] leading-[16px] text-[#F8FAFC] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{copiado ? 'Copiado!' : isGeneratingLink ? 'Gerando...' : 'Copiar Magic Link'}</span>
              </button>

              <button
                type="button"
                disabled={isGeneratingLink}
                onClick={handleOpenShare}
                className="h-[40px] px-3.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white rounded-[10px] font-semibold text-[13px] leading-[16px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-purple-900/20 whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Compartilhar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRevokeModalOpen(true)}
                className="h-[40px] px-3.5 text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/25 rounded-[10px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                title="Revogar acesso do cliente"
              >
                Revogar acesso
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isGeneratingLink}
              onClick={handleCopyLink}
              className="h-[40px] px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white rounded-[10px] font-semibold text-[13px] leading-[16px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
            >
              <span>Gerar novo Magic Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Content Layout: Left (706px) & Right (378px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Histórico de versões */}
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] leading-[22px] font-semibold text-[#F8FAFC]">
              Histórico de versões
            </h2>

            <div className="flex flex-col gap-3.5">
              {versionsList.length === 0 ? (
                <div className="w-full bg-[#1A1D24] border border-dashed border-[#343946]/60 rounded-[16px] p-8 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#242832] flex items-center justify-center text-[#788194]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#F8FAFC]">
                      Nenhuma versão publicada
                    </h3>
                    <p className="text-[12px] text-[#788194] mt-0.5">
                      Suba o primeiro corte para coletar revisões e comentários no timecode.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNovaVersaoOpen(true)}
                    className="mt-1 px-3.5 py-1.5 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A78BFA] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer"
                  >
                    + Adicionar versão
                  </button>
                </div>
              ) : (
                versionsList.map((ver) => (
                <div
                  key={ver.id}
                  className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-[#8B5CF6]/40 transition-colors group"
                >
                  {/* Left: Badge + Title + Subtitle */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Badge: 52px x 28px, rounded: 14px, bg: #312E81 */}
                    <div className="w-[52px] h-[28px] rounded-[14px] bg-[#312E81] flex items-center justify-center shrink-0">
                      <span className="text-[10px] leading-[12px] font-semibold text-[#F8FAFC]">
                        {ver.badge}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] leading-[17px] font-semibold text-[#F8FAFC] truncate group-hover:text-[#A78BFA] transition-colors">
                        {ver.titulo}
                      </span>
                      <span className="text-[12px] leading-[15px] font-normal text-[#A8B0C0] mt-1.5 truncate">
                        {ver.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Right: Status Badge (112x28) + Abrir → link */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    <div
                      className={`w-[112px] h-[28px] ${ver.statusBg} rounded-[14px] flex items-center justify-center shrink-0 px-2`}
                    >
                      <span className="text-[10px] leading-[12px] font-semibold text-[#F8FAFC] tracking-wider uppercase select-none">
                        {ver.statusLabel}
                      </span>
                    </div>

                    <Link
                      to={`/projetos/${id || 'demo'}/versoes/${ver.id}`}
                      className="text-[12px] leading-[15px] font-semibold text-[#A78BFA] hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      Abrir →
                    </Link>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </div>

        {/* Right Column (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card 1: Cliente (378px x 188px) */}
          <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-5 flex flex-col gap-3 shadow-sm">
            <span className="text-[11px] leading-[13px] font-semibold text-[#A8B0C0] uppercase tracking-wider">
              CLIENTE
            </span>

            <h4 className="text-[17px] leading-[21px] font-semibold text-[#F8FAFC] mt-0.5">
              {projeto.clienteNome}
            </h4>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] leading-[16px] font-normal text-[#A8B0C0]">
                {projeto.clienteEmail}
              </span>
              <span className="text-[13px] leading-[16px] font-normal text-[#A8B0C0]">
                {projeto.clienteTelefone}
              </span>
            </div>

            <div className="pt-2">
              {realProjeto?.cliente?.id ? (
                <Link
                  to={`/clientes?clienteId=${realProjeto.cliente.id}`}
                  className="text-[12px] leading-[15px] font-semibold text-[#A78BFA] hover:text-white transition-colors"
                >
                  Ver cadastro →
                </Link>
              ) : (
                <Link
                  to="/clientes"
                  className="text-[12px] leading-[15px] font-semibold text-[#A78BFA] hover:text-white transition-colors"
                >
                  Ver clientes →
                </Link>
              )}
            </div>
          </div>

          {/* Card 2: Atividade recente */}
          <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] leading-[18px] font-semibold text-[#F8FAFC]">
                Atividade recente
              </h3>
              {displayAtividades.length > 0 && (
                <span className="text-[11px] text-[#A8B0C0] bg-[#242832] px-2 py-0.5 rounded-full font-medium">
                  {displayAtividades.length}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3.5 max-h-[280px] overflow-y-auto pr-1">
              {carregandoAtividades ? (
                <div className="flex flex-col gap-2.5 py-2">
                  <div className="h-4 bg-[#242832] rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-[#242832] rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-[#242832] rounded animate-pulse w-2/3" />
                </div>
              ) : displayAtividades.length === 0 ? (
                <p className="text-[12px] text-[#788194] py-4 text-center">
                  Nenhuma atividade registrada ainda.
                </p>
              ) : (
                displayAtividades.map((atv) => (
                  <div key={atv.id} className="flex items-start gap-3">
                    <span className="text-[11px] leading-[14px] font-medium text-[#A78BFA] w-14 shrink-0 pt-0.5">
                      {formatRelativeTime(atv.timestamp)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] leading-[16px] text-[#D7DAE0]">
                        <span className="text-[#C4B5FD] font-semibold">{atv.autor}</span>: {atv.titulo}
                        {atv.tempoVideo && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] font-mono border border-[#8B5CF6]/30">
                            {atv.tempoVideo}
                          </span>
                        )}
                      </p>
                      {atv.descricao && (
                        <p className="text-[11px] text-[#788194] mt-0.5 truncate" title={atv.descricao}>
                          {atv.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nova Versao */}
      <NovaVersaoModal
        isOpen={isNovaVersaoOpen}
        onClose={() => setIsNovaVersaoOpen(false)}
        projetoId={id || '1'}
        proximaVersao={versionsList.length + 1}
      />

      {/* Modal Compartilhar Magic Link */}
      <MagicLinkModal
        isOpen={isShareModalOpen}
        linkUrl={currentMagicLinkUrl || `${window.location.origin}/portal/projetos/${id || 'demo'}`}
        projetoNome={projeto.nome}
        onClose={() => setIsShareModalOpen(false)}
        onRevokeClick={() => setIsRevokeModalOpen(true)}
      />

      {/* Modal Confirmar Revogação */}
      <ConfirmRevocationDialog
        isOpen={isRevokeModalOpen}
        isLoading={isRevoking}
        onClose={() => setIsRevokeModalOpen(false)}
        onConfirm={handleConfirmRevoke}
      />

      {/* Modal Confirmar Alteração / Regras de Etapa */}
      <ConfirmStageModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        onConfirm={handleConfirmStageChange}
        isSubmitting={isUpdatingStatus}
        modalType={stageModalType}
        currentStatus={projeto.etapaAtual}
        targetStatus={pendingTargetStage}
        onCopyLink={handleCopyLink}
        onShareWhatsApp={handleOpenShare}
        onRequestReopenReview={() => {
          setPendingTargetStage('REVISAO_CLIENTE')
          setStageModalType('REOPEN_REVIEW')
        }}
      />
    </div>
  )
}
