import { useState, useEffect } from 'react'

interface MagicLinkModalProps {
  isOpen: boolean
  linkUrl: string
  projetoNome: string
  onClose: () => void
  onRevokeClick: () => void
}

export function MagicLinkModal({
  isOpen,
  linkUrl,
  projetoNome,
  onClose,
  onRevokeClick,
}: MagicLinkModalProps) {
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch (err) {
      console.error('Falha ao copiar link:', err)
    }
  }

  // Gera o link do WhatsApp com mensagem formatada
  const messageText = `Olá! O projeto *${projetoNome}* está pronto para sua revisão no TakeToo.\n\nAcesse pelo link abaixo para assistir e deixar suas anotações no vídeo (sem necessidade de senha):\n${linkUrl}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="magic-link-title"
        className="relative w-full max-w-[540px] bg-[#1A1D24] border border-[#2E3440] rounded-[16px] p-6 shadow-2xl z-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[10px] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 p-1.5 flex items-center justify-center shrink-0 shadow">
              <img src="/logo.png" alt="TakeToo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <h2 id="magic-link-title" className="text-[19px] font-bold text-[#F8FAFC]">
                Link de Acesso do Cliente
              </h2>
              <p className="text-[13px] text-[#A8B0C0] truncate">
                O cliente não precisa de senha para acessar e revisar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A8B0C0] hover:text-white hover:bg-[#242832] transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Link Input with Copy Button */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-[#A8B0C0] uppercase tracking-wider">
            Magic Link de Revisão
          </label>
          <div className="flex items-center gap-2 bg-[#12151C] border border-[#343946] rounded-[10px] p-1.5 focus-within:border-[#8B5CF6] transition-colors">
            <input
              type="text"
              readOnly
              value={linkUrl}
              className="w-full bg-transparent px-2.5 py-1 text-[13px] font-mono text-[#F8FAFC] outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="h-8 px-3 rounded-[8px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[12px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-sm"
            >
              {copiado ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sharing Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 h-[42px] rounded-[10px] bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/40 text-[#22C55E] text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
            </svg>
            <span>Enviar pelo WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => {
              onClose()
              onRevokeClick()
            }}
            className="w-full sm:w-auto h-[42px] px-4 rounded-[10px] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-[13px] font-semibold transition-colors cursor-pointer"
          >
            Revogar / Desativar Link
          </button>
        </div>
      </div>
    </div>
  )
}
