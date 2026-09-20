import { useState } from 'react'
import { useCriarProjeto } from '../hooks/useProjetos.ts'
import { useClientes, useCriarCliente } from '../hooks/useClientes.ts'

interface NovoProjetoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NovoProjetoModal({ isOpen, onClose }: NovoProjetoModalProps) {
  const { data: clientes } = useClientes()
  const { mutate: criarProjeto, isPending: isCreatingProjeto } = useCriarProjeto()
  const { mutate: criarCliente, isPending: isCreatingCliente } = useCriarCliente()

  const [nomeProjeto, setNomeProjeto] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('')
  const [showNovoCliente, setShowNovoCliente] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setNomeProjeto('')
    setClienteId('')
    setDescricao('')
    setNovoClienteNome('')
    setNovoClienteTelefone('')
    setShowNovoCliente(false)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()

    if (showNovoCliente) {
      if (!novoClienteNome.trim() || !novoClienteTelefone.trim()) return
      criarCliente(
        { nome: novoClienteNome.trim(), telefone: novoClienteTelefone.trim() },
        {
          onSuccess: (clienteCriado) => {
            if (clienteCriado.id) {
              criarProjeto(
                { nome: nomeProjeto.trim(), clienteId: clienteCriado.id },
                {
                  onSuccess: () => {
                    handleClose()
                  },
                }
              )
            }
          },
        }
      )
    } else {
      if (!nomeProjeto.trim() || !clienteId) return
      criarProjeto(
        { nome: nomeProjeto.trim(), clienteId },
        {
          onSuccess: () => {
            handleClose()
          },
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090D]/80 backdrop-blur-[4px]">
      {/* Dialog · Criar Novo Projeto */}
      <div className="w-full max-w-[600px] bg-[#1A1D24] border border-[#2E3440] rounded-[16px] shadow-[0px_24px_48px_rgba(0,0,0,0.45)] p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 p-2 flex items-center justify-center shrink-0 shadow">
              <img src="/logo.png" alt="TakeToo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-[22px] leading-[27px] text-[#F8FAFC]">
                Criar Novo Projeto
              </h2>
              <p className="font-normal text-[13px] leading-[16px] text-[#A8B0C0] mt-1">
                Configure as informações iniciais do trabalho.
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
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          {/* Field 1: Cliente */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[12px] leading-[15px] text-[#A8B0C0]">
              Cliente
            </label>

            {!showNovoCliente ? (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <select
                    required
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className={`w-full h-[48px] bg-[#12151C] border border-[#2E3440] rounded-[10px] px-3.5 pr-10 text-[13px] leading-[16px] appearance-none focus:outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer ${
                      clienteId ? 'text-[#F8FAFC]' : 'text-[#788194]'
                    }`}
                  >
                    <option value="" disabled className="bg-[#12151C] text-[#788194]">
                      Selecione um cliente
                    </option>
                    {clientes?.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#12151C] text-[#F8FAFC]">
                        {c.nome} ({c.telefone})
                      </option>
                    ))}
                  </select>

                  {/* Dropdown Chevron */}
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8B0C0]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* + novo cliente trigger */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNovoCliente(true)}
                    className="font-semibold text-[12px] leading-[15px] text-[#A78BFA] hover:underline cursor-pointer"
                  >
                    + novo cliente
                  </button>
                </div>
              </div>
            ) : (
              /* Inline Subform: Novo Cliente */
              <div className="flex flex-col gap-3 p-4 bg-[#12151C] border border-[#2E3440] rounded-[10px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[12px] text-[#A78BFA]">
                    Novo Cliente
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNovoCliente(false)}
                    className="text-[12px] text-[#A8B0C0] hover:text-[#F8FAFC] hover:underline cursor-pointer"
                  >
                    Voltar para lista
                  </button>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Nome do Cliente (ex: Studio Aurora)"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  className="w-full h-[44px] bg-[#1A1D24] border border-[#2E3440] rounded-[10px] px-3.5 text-[13px] text-[#F8FAFC] placeholder-[#788194] focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />

                <input
                  type="tel"
                  required
                  placeholder="Telefone / WhatsApp (ex: 11999999999)"
                  value={novoClienteTelefone}
                  onChange={(e) => setNovoClienteTelefone(e.target.value)}
                  className="w-full h-[44px] bg-[#1A1D24] border border-[#2E3440] rounded-[10px] px-3.5 text-[13px] text-[#F8FAFC] placeholder-[#788194] focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>
            )}
          </div>

          {/* Field 2: Título do Projeto */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[12px] leading-[15px] text-[#A8B0C0]">
              Título do Projeto
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Comercial de Natal"
              value={nomeProjeto}
              onChange={(e) => setNomeProjeto(e.target.value)}
              className="w-full h-[48px] bg-[#12151C] border border-[#2E3440] rounded-[10px] px-3.5 text-[13px] leading-[16px] text-[#F8FAFC] placeholder-[#788194] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
          </div>

          {/* Field 3: Descrição e Instruções de Corte · opcional */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[12px] leading-[15px] text-[#A8B0C0]">
                Descrição e Instruções de Corte · opcional
              </label>
            </div>

            <div className="flex flex-col">
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Conte o contexto, referências e instruções importantes..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full h-[122px] bg-[#12151C] border border-[#2E3440] rounded-[10px] p-3.5 text-[13px] leading-[16px] text-[#F8FAFC] placeholder-[#788194] resize-none focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
              <span className="font-medium text-[10px] leading-[12px] text-[#667085] text-right mt-1.5 select-none">
                {descricao.length} / 1000
              </span>
            </div>
          </div>

          {/* Divider line */}
          <div className="w-full h-[1px] bg-[#2E3440] my-1" />

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="font-normal text-[11px] leading-[13px] text-[#788194]">
              Você poderá publicar a primeira versão depois.
            </span>

            <div className="flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="w-[116px] h-[44px] bg-[#1A1D24] border border-[#3A414F] rounded-[10px] font-semibold text-[13px] leading-[16px] text-[#D7DAE0] hover:bg-[#242832] transition-colors cursor-pointer flex items-center justify-center"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isCreatingProjeto || isCreatingCliente}
                className="w-[124px] h-[44px] bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 rounded-[10px] font-semibold text-[13px] leading-[16px] text-[#F8FAFC] shadow-lg shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center"
              >
                {isCreatingProjeto || isCreatingCliente ? 'Criando...' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
