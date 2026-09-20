import { useState } from 'react'
import { useCriarCliente } from '../hooks/useClientes.ts'

interface NovoClienteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NovoClienteModal({ isOpen, onClose }: NovoClienteModalProps) {
  const { mutate: criarCliente, isPending: isCreating } = useCriarCliente()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setNome('')
    setEmail('')
    setTelefone('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !telefone.trim()) return

    criarCliente(
      {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() ? email.trim() : undefined,
      },
      {
        onSuccess: () => {
          handleClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[4px]">
      {/* Dialog · Cadastrar Novo Cliente */}
      <div className="w-full max-w-[560px] bg-[#1A1D24] border border-[#2E3440] rounded-[16px] shadow-[0px_24px_48px_rgba(0,0,0,0.45)] p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 p-2 flex items-center justify-center shrink-0 shadow">
              <img src="/logo.png" alt="TakeToo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-[22px] leading-[27px] text-[#F8FAFC]">
                Cadastrar Novo Cliente
              </h2>
              <p className="font-normal text-[13px] leading-[16px] text-[#A8B0C0] mt-1">
                Adicione o contato que receberá os links de revisão.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Field 1: Nome do Cliente / Empresa */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[12px] leading-[15px] text-[#A8B0C0]">
              Nome do Cliente / Empresa
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Studio Aurora"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-[48px] bg-[#12151C] border border-[#2E3440] rounded-[10px] px-3.5 text-[13px] text-[#F8FAFC] placeholder-[#788194] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
          </div>

          {/* Field 2: E-mail de Contato */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[12px] leading-[15px] text-[#A8B0C0]">
              E-mail de Contato
            </label>
            <input
              type="email"
              placeholder="cliente@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[48px] bg-[#12151C] border border-[#2E3440] rounded-[10px] px-3.5 text-[13px] text-[#F8FAFC] placeholder-[#788194] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
          </div>

          {/* Field 3: WhatsApp / Telefone */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[12px] leading-[15px] text-[#A8B0C0]">
              WhatsApp / Telefone
            </label>
            <input
              type="tel"
              required
              placeholder="+55 (15) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full h-[48px] bg-[#12151C] border border-[#2E3440] rounded-[10px] px-3.5 text-[13px] text-[#F8FAFC] placeholder-[#788194] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
          </div>

          {/* Info Banner */}
          <div className="w-full min-h-[58px] bg-[#201C35] rounded-[10px] px-3.5 py-4 flex items-center">
            <p className="font-normal text-[11px] leading-[15px] text-[#C4B5FD]">
              O contato será usado somente para compartilhar revisões e atualizações.
            </p>
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
              disabled={isCreating}
              className="w-[120px] h-[44px] bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 rounded-[10px] font-semibold text-[13px] leading-[16px] text-[#F8FAFC] shadow-lg shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center"
            >
              {isCreating ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
