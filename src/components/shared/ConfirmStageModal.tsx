import { useEffect } from 'react'
import type { StatusProjeto } from '../../api/types.ts'

export type StageModalType =
  | 'CONFIRM_CHANGE'
  | 'CLIENT_APPROVAL_ONLY'
  | 'DELIVERY_NEEDS_APPROVAL'
  | 'LOCKED_STAGE'
  | 'REOPEN_REVIEW'

interface ConfirmStageModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting?: boolean
  modalType: StageModalType
  currentStatus: StatusProjeto
  targetStatus: StatusProjeto | null
  magicLinkUrl?: string
  onShareWhatsApp?: () => void
  onCopyLink?: () => void
  onRequestReopenReview?: () => void
}

const STAGE_NAMES: Record<StatusProjeto, string> = {
  GRAVACAO_CONCLUIDA: 'Gravação Concluída',
  EM_EDICAO: 'Em Edição',
  REVISAO_CLIENTE: 'Revisão do Cliente',
  APROVADO: 'Aprovado',
  ENTREGUE: 'Entregue',
}

const STAGE_BADGES: Record<StatusProjeto, string> = {
  GRAVACAO_CONCLUIDA: 'bg-[#6366F1]/15 text-[#818CF8] border-[#6366F1]/30',
  EM_EDICAO: 'bg-[#8B5CF6]/15 text-[#C4B5FD] border-[#8B5CF6]/30',
  REVISAO_CLIENTE: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  APROVADO: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  ENTREGUE: 'bg-[#10B981]/25 text-[#34D399] border-[#10B981]/40',
}

export function ConfirmStageModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  modalType,
  currentStatus,
  targetStatus,
  onCopyLink,
  onShareWhatsApp,
  onRequestReopenReview,
}: ConfirmStageModalProps) {
  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  // 1. Caso: Aprovação exclusiva do cliente
  if (modalType === 'CLIENT_APPROVAL_ONLY') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[6px] animate-in fade-in duration-200">
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-[500px] bg-[#1A1D24] border border-[#2E3440] rounded-[20px] shadow-[0px_24px_48px_rgba(0,0,0,0.5)] p-6 sm:p-7 flex flex-col gap-6 animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <h3 className="text-[18px] sm:text-[20px] font-bold text-[#F8FAFC]">
                Aprovação Exclusiva do Cliente
              </h3>
              <p className="text-[13px] leading-relaxed text-[#A8B0C0]">
                Apenas o cliente pode aprovar formalmente o projeto através do Magic Link no Portal do Cliente.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#A8B0C0] hover:text-[#F8FAFC] rounded-lg hover:bg-[#242832] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Info Card */}
          <div className="bg-[#12151C] border border-[#2E3440] rounded-[12px] p-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-[#C4B5FD] uppercase tracking-wider">
              Como funciona a aprovação:
            </span>
            <p className="text-[12px] text-[#A8B0C0] leading-relaxed">
              Compartilhe o Magic Link com seu cliente. Assim que ele assistir ao corte no Portal e clicar no botão <strong className="text-[#10B981]">"Aprovar versão"</strong>, o status do projeto avançará automaticamente para <strong className="text-[#10B981]">"Aprovado"</strong> e os comentários serão encerrados.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            {onCopyLink && (
              <button
                type="button"
                onClick={onCopyLink}
                className="w-full sm:w-auto h-[40px] px-4 rounded-[10px] bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-[#343946]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copiar Magic Link</span>
              </button>
            )}

            {onShareWhatsApp && (
              <button
                type="button"
                onClick={onShareWhatsApp}
                className="w-full sm:w-auto h-[40px] px-4 rounded-[10px] bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40 text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Enviar no WhatsApp</span>
                <span>↗</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto h-[40px] px-5 rounded-[10px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[13px] font-semibold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Caso: Tentativa de entrega antes da aprovação
  if (modalType === 'DELIVERY_NEEDS_APPROVAL') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[6px] animate-in fade-in duration-200">
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-[500px] bg-[#1A1D24] border border-[#2E3440] rounded-[20px] shadow-[0px_24px_48px_rgba(0,0,0,0.5)] p-6 sm:p-7 flex flex-col gap-6 animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <h3 className="text-[18px] sm:text-[20px] font-bold text-[#F8FAFC]">
                Aprovação Necessária para Entrega
              </h3>
              <p className="text-[13px] leading-relaxed text-[#A8B0C0]">
                O projeto só pode ser finalizado e entregue após o cliente aprovar formalmente o corte de vídeo.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#A8B0C0] hover:text-[#F8FAFC] rounded-lg hover:bg-[#242832] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="bg-[#12151C] border border-[#2E3440] rounded-[12px] p-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-[#F87171] uppercase tracking-wider">
              Status Atual: {STAGE_NAMES[currentStatus]}
            </span>
            <p className="text-[12px] text-[#A8B0C0] leading-relaxed">
              Mantenha o projeto em <strong className="text-[#F59E0B]">"Revisão do cliente"</strong> e aguarde a aprovação no Portal para liberar a entrega final.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCopyLink && (
              <button
                type="button"
                onClick={onCopyLink}
                className="h-[40px] px-4 rounded-[10px] bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] text-[13px] font-semibold transition-colors cursor-pointer flex items-center gap-2 border border-[#343946]"
              >
                <span>Copiar Magic Link</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-[40px] px-5 rounded-[10px] bg-[#3A414F] hover:bg-[#4B5565] text-white text-[13px] font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Caso: Etapa bloqueada porque o projeto já foi Aprovado ou Entregue
  if (modalType === 'LOCKED_STAGE') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[6px] animate-in fade-in duration-200">
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-[500px] bg-[#1A1D24] border border-[#2E3440] rounded-[20px] shadow-[0px_24px_48px_rgba(0,0,0,0.5)] p-6 sm:p-7 flex flex-col gap-6 animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <h3 className="text-[18px] sm:text-[20px] font-bold text-[#F8FAFC]">
                Etapa Bloqueada
              </h3>
              <p className="text-[13px] leading-relaxed text-[#A8B0C0]">
                O projeto já foi {currentStatus === 'ENTREGUE' ? 'concluído e entregue' : 'aprovado pelo cliente'}. Não é permitido retornar diretamente para etapas de produção.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#A8B0C0] hover:text-[#F8FAFC] rounded-lg hover:bg-[#242832] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="bg-[#12151C] border border-[#2E3440] rounded-[12px] p-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-[#F59E0B] uppercase tracking-wider">
              Aprovado por engano?
            </span>
            <p className="text-[12px] text-[#A8B0C0] leading-relaxed">
              Caso o cliente tenha aprovado por engano ou solicite novos ajustes extraordinários, você pode utilizar a opção de <strong className="text-[#F59E0B]">"Devolver para revisão do cliente"</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[40px] px-4 rounded-[10px] bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] text-[13px] font-semibold transition-colors cursor-pointer border border-[#343946]"
            >
              Fechar
            </button>

            {onRequestReopenReview && (
              <button
                type="button"
                onClick={onRequestReopenReview}
                className="h-[40px] px-5 rounded-[10px] bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-[13px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-600/20"
              >
                <span>Devolver para Revisão</span>
                <span>↩</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 4. Caso: Devolver para Revisão do Cliente (reabertura pós-aprovação ou pós-entrega)
  if (modalType === 'REOPEN_REVIEW') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[6px] animate-in fade-in duration-200">
        <div
          className="fixed inset-0"
          onClick={() => {
            if (!isSubmitting) onClose()
          }}
          aria-hidden="true"
        />

        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-[520px] bg-[#1A1D24] border border-[#2E3440] rounded-[20px] shadow-[0px_24px_48px_rgba(0,0,0,0.5)] p-6 sm:p-7 flex flex-col gap-6 animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 uppercase">
                  Reabertura de Projeto
                </span>
              </div>
              <h3 className="text-[18px] sm:text-[20px] font-bold text-[#F8FAFC]">
                Devolver para Revisão do Cliente?
              </h3>
              <p className="text-[13px] leading-relaxed text-[#A8B0C0]">
                Utilize esta opção caso o cliente tenha aprovado por engano ou precise de novos apontamentos.
              </p>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="p-1 text-[#A8B0C0] hover:text-[#F8FAFC] rounded-lg hover:bg-[#242832] transition-colors cursor-pointer disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Transition De -> Para */}
          <div className="bg-[#12151C] border border-[#2E3440] rounded-[14px] p-4 flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-semibold text-[#788194] uppercase tracking-wider">
                Status Atual
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border w-fit ${
                  STAGE_BADGES[currentStatus]
                }`}
              >
                {STAGE_NAMES[currentStatus]}
              </span>
            </div>

            <div className="text-[#F59E0B] text-lg font-bold">↩</div>

            <div className="flex flex-col gap-1 min-w-0 text-right">
              <span className="text-[10px] font-semibold text-[#788194] uppercase tracking-wider">
                Novo Status
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border w-fit ml-auto ${
                  STAGE_BADGES['REVISAO_CLIENTE']
                }`}
              >
                Revisão do Cliente
              </span>
            </div>
          </div>

          <p className="text-[12px] text-[#A8B0C0] leading-relaxed">
            Ao confirmar, o projeto retornará para a etapa de <strong className="text-[#F59E0B]">"Revisão do cliente"</strong>. O Magic Link voltará a ficar ativo para permitir que o cliente envie novos comentários nos timecodes.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-[42px] px-5 rounded-[10px] bg-[#1A1D24] border border-[#3A414F] hover:bg-[#242832] text-[#D7DAE0] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirm}
              className="h-[42px] px-6 rounded-[10px] bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-[13px] transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Devolvendo...</span>
                </>
              ) : (
                'Confirmar Devolução para Revisão'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 5. Caso: Confirmação normal de mudança permitida (Em Edição <-> Revisão do Cliente, ou Entrega Final pós-aprovação)
  const isDelivery = targetStatus === 'ENTREGUE'
  const targetName = targetStatus ? STAGE_NAMES[targetStatus] : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[6px] animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[520px] bg-[#1A1D24] border border-[#2E3440] rounded-[20px] shadow-[0px_24px_48px_rgba(0,0,0,0.5)] p-6 sm:p-7 flex flex-col gap-6 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 border ${
              isDelivery
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                : 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30'
            }`}
          >
            {isDelivery ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h3 className="text-[18px] sm:text-[20px] font-bold text-[#F8FAFC]">
              {isDelivery ? 'Confirmar Entrega do Projeto' : `Alterar para "${targetName}"`}
            </h3>
            <p className="text-[13px] leading-relaxed text-[#A8B0C0]">
              {isDelivery
                ? 'Esta ação conclui definitivamente o projeto com a aprovação do cliente. O Magic Link será finalizado.'
                : 'Confirme a transição de etapa deste projeto no fluxo de produção.'}
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1 text-[#A8B0C0] hover:text-[#F8FAFC] rounded-lg hover:bg-[#242832] transition-colors cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Transition Visual Step: De -> Para */}
        <div className="bg-[#12151C] border border-[#2E3440] rounded-[14px] p-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-semibold text-[#788194] uppercase tracking-wider">
              Etapa Atual
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border w-fit ${
                STAGE_BADGES[currentStatus]
              }`}
            >
              {STAGE_NAMES[currentStatus]}
            </span>
          </div>

          <div className="text-[#A78BFA] text-lg font-bold">→</div>

          <div className="flex flex-col gap-1 min-w-0 text-right">
            <span className="text-[10px] font-semibold text-[#788194] uppercase tracking-wider">
              Nova Etapa
            </span>
            {targetStatus && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border w-fit ml-auto ${
                  STAGE_BADGES[targetStatus]
                }`}
              >
                {STAGE_NAMES[targetStatus]}
              </span>
            )}
          </div>
        </div>

        {/* Descriptive Note */}
        <p className="text-[12px] text-[#A8B0C0] leading-relaxed">
          {targetStatus === 'REVISAO_CLIENTE' &&
            'O cliente poderá abrir o Magic Link para assistir à versão mais recente e deixar anotações nos timecodes.'}
          {targetStatus === 'EM_EDICAO' &&
            'A equipe poderá subir novas versões de corte e realizar alterações solicitadas pelo cliente.'}
          {targetStatus === 'GRAVACAO_CONCLUIDA' &&
            'O projeto retornará para o estágio de pós-gravação aguardando os primeiros cortes.'}
          {targetStatus === 'ENTREGUE' &&
            'Todos os arquivos e aprovações foram validados. O projeto será marcado como entregue e o link será encerrado.'}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="h-[42px] px-5 rounded-[10px] bg-[#1A1D24] border border-[#3A414F] hover:bg-[#242832] text-[#D7DAE0] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`h-[42px] px-6 rounded-[10px] text-white text-[13px] font-semibold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              isDelivery
                ? 'bg-[#10B981] hover:bg-[#059669] shadow-emerald-600/20'
                : 'bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-purple-600/25'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Atualizando...</span>
              </>
            ) : isDelivery ? (
              'Confirmar Entrega'
            ) : (
              'Confirmar Alteração'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
