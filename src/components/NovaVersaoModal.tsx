import { useState } from 'react'
import { useCriarVersao } from '../hooks/useVersoes.ts'
import { resolveVideoSource } from '../lib/videoSource.ts'

interface NovaVersaoModalProps {
  isOpen: boolean
  onClose: () => void
  projetoId: string
  proximaVersao?: number
}

export function NovaVersaoModal({
  isOpen,
  onClose,
  projetoId,
  proximaVersao = 1,
}: NovaVersaoModalProps) {
  const { mutate: criarVersao, isPending } = useCriarVersao(projetoId)
  const [arquivoUrl, setArquivoUrl] = useState('')
  const source = resolveVideoSource(arquivoUrl)

  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setArquivoUrl('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!arquivoUrl.trim()) return

    criarVersao(
      { arquivoUrl: arquivoUrl.trim() },
      {
        onSuccess: () => {
          handleClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[4px]">
      <div className="w-full max-w-[500px] bg-[#1A1D24] border border-[#2E3440] rounded-[16px] shadow-[0px_24px_48px_rgba(0,0,0,0.45)] p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[11px] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 p-1.5 flex items-center justify-center shrink-0 shadow">
              <img src="/logo.png" alt="TakeToo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-[22px] leading-[27px] text-[#F8FAFC]">
                Publicar Versão {proximaVersao > 0 ? `V${proximaVersao}` : ''}
              </h2>
              <p className="font-normal text-[13px] leading-[16px] text-[#A8B0C0] mt-1">
                Disponibilize um novo corte para revisão do cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="text-[#A8B0C0] hover:text-[#F8FAFC] transition-colors cursor-pointer text-[24px] leading-[29px] p-1 select-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[12px] leading-[15px] text-[#A8B0C0]">
              URL do vídeo (MP4, YouTube, Google Drive, S3 ou Storage)
            </label>
            <input
              type="url"
              required
              placeholder="https://youtube.com/watch?v=... ou https://.../corte-v2.mp4"
              value={arquivoUrl}
              onChange={(e) => setArquivoUrl(e.target.value)}
              className="w-full h-[48px] bg-[#12151C] border border-[#2E3440] rounded-[10px] px-3.5 text-[13px] text-[#F8FAFC] placeholder-[#788194] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
            {arquivoUrl.trim() && (
              <p className="text-[11px] leading-[15px] text-[#A8B0C0]">
                {source.supportsTimeline
                  ? source.type === 'youtube'
                    ? 'YouTube detectado: comentários por segundo e controles do portal disponíveis.'
                    : 'Vídeo direto detectado: comentários por segundo e controles do portal disponíveis.'
                  : source.message || 'O portal tentará abrir este vídeo em um player incorporado.'}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#2E3440] my-1" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-[116px] h-[44px] bg-[#1A1D24] border border-[#3A414F] rounded-[10px] font-semibold text-[13px] leading-[16px] text-[#D7DAE0] hover:bg-[#242832] transition-colors cursor-pointer flex items-center justify-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="px-6 h-[44px] bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 rounded-[10px] font-semibold text-[13px] leading-[16px] text-[#F8FAFC] shadow-lg shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center"
            >
              {isPending ? 'Publicando...' : 'Publicar Versão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
