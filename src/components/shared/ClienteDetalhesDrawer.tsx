import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCliente } from '../../hooks/useClientes.ts'
import { useProjetos } from '../../hooks/useProjetos.ts'
import { useToast } from '../../context/useToast.ts'
import { SHOWCASE_CLIENTS } from '../../data/showcaseClients.ts'
import { formatRelativeTime } from '../../utils/date.ts'

interface ClienteDetalhesDrawerProps {
  clienteId: string | null
  onClose: () => void
}

const statusLabels: Record<string, { label: string; badgeClass: string }> = {
  GRAVACAO_CONCLUIDA: {
    label: 'Gravação Concluída',
    badgeClass: 'bg-[#6366F1]/15 text-[#818CF8] border-[#6366F1]/30',
  },
  EM_EDICAO: {
    label: 'Em Edição',
    badgeClass: 'bg-[#8B5CF6]/15 text-[#C4B5FD] border-[#8B5CF6]/30',
  },
  REVISAO_CLIENTE: {
    label: 'Revisão do Cliente',
    badgeClass: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  },
  APROVADO: {
    label: 'Aprovado',
    badgeClass: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  },
  ENTREGUE: {
    label: 'Entregue',
    badgeClass: 'bg-[#6B7280]/15 text-[#D1D5DB] border-[#6B7280]/30',
  },
}

function formatPhoneNumber(phone?: string): string {
  if (!phone) return 'Não informado'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

function getWhatsAppUrl(phone?: string): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/\D/g, '')
  if (!cleaned) return null
  const fullNumber = cleaned.startsWith('55') ? cleaned : `55${cleaned}`
  return `https://wa.me/${fullNumber}`
}

export function ClienteDetalhesDrawer({ clienteId, onClose }: ClienteDetalhesDrawerProps) {
  const isShowcase = Boolean(clienteId?.startsWith('showcase-'))

  // Only query backend for non-showcase UUIDs
  const {
    data: realCliente,
    isLoading: isLoadingReal,
    isError: isErrorReal,
  } = useCliente(!isShowcase && clienteId ? clienteId : undefined)

  const { data: allProjetos } = useProjetos()
  const toast = useToast()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Find showcase client if ID is showcase
  const showcaseClient = useMemo(() => {
    if (!clienteId || !isShowcase) return null
    return SHOWCASE_CLIENTS.find((c) => c.id === clienteId) || null
  }, [clienteId, isShowcase])

  // Resolve client data from real API or showcase fallback
  const cliente = useMemo(() => {
    if (isShowcase) {
      if (!showcaseClient) return null
      return {
        id: showcaseClient.id,
        nome: showcaseClient.nome,
        email: showcaseClient.email,
        telefone: showcaseClient.telefone,
      }
    }
    return realCliente || null
  }, [isShowcase, showcaseClient, realCliente])

  const isLoading = !isShowcase && isLoadingReal
  const isError = !isShowcase && (isErrorReal || (!isLoadingReal && !realCliente))

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (clienteId) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clienteId, onClose])

  if (!clienteId) return null

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success(`${fieldName} copiado para a área de transferência!`)
      setTimeout(() => setCopiedField(null), 2500)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  // Related projects: from real projects or showcase
  const projetosDoCliente =
    !isShowcase && allProjetos
      ? allProjetos.filter((p) => p.cliente?.id === clienteId)
      : showcaseClient?.projetos || []

  const whatsAppUrl = getWhatsAppUrl(cliente?.telefone)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[6px] animate-in fade-in duration-200">
      {/* Backdrop click dismiss */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-[600px] bg-[#1A1D24] border border-[#2E3440] rounded-[20px] shadow-[0px_24px_48px_rgba(0,0,0,0.5)] p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#2E3440]">
          {isLoading ? (
            <div className="flex items-center gap-4 w-full">
              <div className="w-14 h-14 rounded-[14px] bg-[#242832] animate-pulse shrink-0" />
              <div className="flex flex-col gap-2 w-full">
                <div className="h-5 w-1/3 bg-[#242832] rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-[#242832] rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white flex items-center justify-center font-bold text-[18px] shadow-lg shadow-purple-900/30 shrink-0">
                {cliente?.nome ? cliente.nome.slice(0, 2).toUpperCase() : 'CL'}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#A78BFA] uppercase tracking-wider">
                    Ficha do Cliente
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[11px] text-[#A8B0C0]">Ativo</span>
                  {cliente?.criadoEm && (
                    <>
                      <span className="text-[11px] text-[#5A6275]">•</span>
                      <span className="text-[11px] text-[#A8B0C0]">
                        Cadastrado {formatRelativeTime(cliente.criadoEm)}
                      </span>
                    </>
                  )}
                </div>

                <h2 id="modal-title" className="text-[20px] sm:text-[22px] font-bold text-[#F8FAFC] tracking-tight truncate mt-0.5">
                  {cliente?.nome || 'Cliente'}
                </h2>

                <span className="text-[12px] text-[#A8B0C0]">
                  {cliente?.totalProjetos !== undefined ? cliente.totalProjetos : projetosDoCliente.length} {(cliente?.totalProjetos ?? projetosDoCliente.length) === 1 ? 'projeto vinculado' : 'projetos vinculados'}
                  {cliente?.ultimaAtividadeEm && ` • Ativo ${formatRelativeTime(cliente.ultimaAtividadeEm)}`}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A8B0C0] hover:text-white hover:bg-[#242832] transition-colors cursor-pointer shrink-0"
            aria-label="Fechar modal do cliente"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="h-20 w-full bg-[#242832] rounded-xl animate-pulse" />
            <div className="h-24 w-full bg-[#242832] rounded-xl animate-pulse" />
          </div>
        ) : isError || !cliente ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-[14px] text-[#F8FAFC] font-semibold">Cliente não encontrado</p>
            <p className="text-[12px] text-[#A8B0C0]">Não foi possível carregar as informações.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Contact Information */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold text-[#A8B0C0] uppercase tracking-wider">
                Informações de Contato
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email Box */}
                <div className="bg-[#12151C] border border-[#2E3440] rounded-[14px] p-4 flex flex-col justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-[9px] bg-[#8B5CF6]/15 text-[#A78BFA] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[#788194] uppercase font-semibold">E-mail</span>
                      <span className="text-[13px] text-[#F8FAFC] font-medium truncate" title={cliente.email || ''}>
                        {cliente.email || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  {cliente.email && (
                    <button
                      type="button"
                      onClick={() => handleCopy(cliente.email!, 'E-mail')}
                      className="self-end px-3 py-1 rounded-[7px] bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {copiedField === 'E-mail' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  )}
                </div>

                {/* WhatsApp Box */}
                <div className="bg-[#12151C] border border-[#2E3440] rounded-[14px] p-4 flex flex-col justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-[9px] bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[#788194] uppercase font-semibold">WhatsApp / Telefone</span>
                      <span className="text-[13px] text-[#F8FAFC] font-medium truncate">
                        {formatPhoneNumber(cliente.telefone)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 self-end">
                    {cliente.telefone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(cliente.telefone!, 'Telefone')}
                        className="px-3 py-1 rounded-[7px] bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        {copiedField === 'Telefone' ? '✓ Copiado' : 'Copiar'}
                      </button>
                    )}
                    {whatsAppUrl && (
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-[7px] bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>Conversar</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Related Projects Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A8B0C0] uppercase tracking-wider">
                  Projetos Vinculados ({projetosDoCliente.length})
                </span>
              </div>

              {projetosDoCliente.length === 0 ? (
                <div className="bg-[#12151C] border border-[#2E3440]/60 rounded-[14px] p-6 text-center flex flex-col items-center gap-2 text-[13px] text-[#A8B0C0]">
                  <span>Nenhum projeto cadastrado para este cliente ainda.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {projetosDoCliente.map((p) => {
                    const stageKey = p.etapaAtual || 'EM_EDICAO'
                    const stageInfo = statusLabels[stageKey] || {
                      label: stageKey,
                      badgeClass: 'bg-[#8B5CF6]/15 text-[#C4B5FD] border-[#8B5CF6]/30',
                    }

                    return (
                      <Link
                        key={p.id}
                        to={`/projetos/${p.id}`}
                        onClick={onClose}
                        className="bg-[#12151C] hover:bg-[#242832]/80 border border-[#2E3440] hover:border-[#8B5CF6]/50 rounded-[12px] p-3.5 flex items-center justify-between transition-all group cursor-pointer shadow-sm"
                      >
                        <div className="flex flex-col min-w-0 gap-1.5">
                          <span className="text-[14px] font-semibold text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors truncate">
                            {p.nome}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${stageInfo.badgeClass}`}
                            >
                              {stageInfo.label}
                            </span>
                            {(p.atualizadoEm || p.criadoEm) && (
                              <span className="text-[11px] text-[#788194]">
                                • {formatRelativeTime(p.atualizadoEm || p.criadoEm)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[#A78BFA] group-hover:translate-x-1 transition-transform">
                          <span className="text-[12px] font-semibold">Abrir projeto</span>
                          <span className="text-base">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#2E3440] flex items-center justify-between gap-3">
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[40px] px-4 rounded-[10px] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 text-[13px] font-semibold flex items-center gap-2 transition-colors"
            >
              <span>Abrir no WhatsApp</span>
              <span>↗</span>
            </a>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="h-[40px] px-6 rounded-[10px] bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] text-[13px] font-semibold transition-colors cursor-pointer border border-[#343946]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
