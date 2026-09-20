import { useEffect } from 'react'

interface ConfirmRevocationDialogProps {
  isOpen: boolean
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmRevocationDialog({
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: ConfirmRevocationDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isLoading) onClose()
        }}
      />

      {/* Dialog Body */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="revocation-title"
        className="relative w-full max-w-[460px] bg-[#1A1D24] border border-[#2E3440] rounded-[16px] p-6 shadow-2xl z-10 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <div className="flex flex-col gap-1">
            <h3 id="revocation-title" className="text-[17px] font-bold text-[#F8FAFC]">
              Revogar acesso do cliente?
            </h3>
            <p className="text-[13px] leading-relaxed text-[#A8B0C0]">
              O link atual deixará de funcionar imediatamente. O cliente não conseguirá mais visualizar o projeto nem deixar comentários até que você gere um novo Magic Link.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2E3440]/60">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-[10px] bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] text-[13px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-[10px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-red-600/25 cursor-pointer"
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isLoading ? 'Revogando...' : 'Revogar acesso'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
