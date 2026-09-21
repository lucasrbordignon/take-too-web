import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useClientes } from '../hooks/useClientes.ts'
import { useProjetos } from '../hooks/useProjetos.ts'
import { NovoClienteModal } from '../components/NovoClienteModal.tsx'
import { ClienteDetalhesDrawer } from '../components/shared/ClienteDetalhesDrawer.tsx'
import { formatRelativeTime, formatYear } from '../utils/date.ts'

interface ClientRowItem {
  id: string
  nome: string
  subtitle: string
  email: string
  telefone: string
  projetosCount: number
  ultimaAtividade: string
  avatarBg: string
}

export function ClientesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlClienteId = searchParams.get('clienteId') || searchParams.get('id')
  const [localClienteId, setLocalClienteId] = useState<string | null>(null)
  const activeClienteId = urlClienteId || localClienteId

  const { data: realClientes, isLoading } = useClientes()
  const { data: realProjetos } = useProjetos()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenClient = (id: string) => {
    setLocalClienteId(id)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('clienteId', id)
        return next
      },
      { replace: false }
    )
  }

  const handleCloseDrawer = () => {
    setLocalClienteId(null)
    if (urlClienteId) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('clienteId')
          next.delete('id')
          return next
        },
        { replace: true }
      )
    }
  }

  // Map real clients with project counts
  const clientList = useMemo<ClientRowItem[]>(() => {
    if (realClientes && realClientes.length > 0) {
      return realClientes.map((c, idx) => {
        // Count projects associated with this client: backend totalProjetos or fallback to realProjetos
        const count =
          c.totalProjetos !== undefined && c.totalProjetos !== null
            ? c.totalProjetos
            : realProjetos
            ? realProjetos.filter((p) => p.cliente?.id === c.id).length
            : 0

        const avatarColors = ['bg-[#8B5CF6]', 'bg-[#6366F1]']
        const color = avatarColors[idx % 2]

        // Ultima atividade dinamica: ultimaAtividadeEm real ou fallback criadoEm
        const ultimaAtividade = c.ultimaAtividadeEm
          ? formatRelativeTime(c.ultimaAtividadeEm)
          : c.criadoEm
          ? formatRelativeTime(c.criadoEm)
          : 'Sem atividade'

        return {
          id: c.id || String(idx),
          nome: c.nome || 'Cliente sem nome',
          subtitle: c.criadoEm ? `Cliente desde ${formatYear(c.criadoEm)}` : 'Cliente desde 2026',
          email: c.email || 'contato@cliente.com',
          telefone: c.telefone || 'Sem telefone',
          projetosCount: count,
          ultimaAtividade,
          avatarBg: color,
        }
      })
    }

    return []
  }, [realClientes, realProjetos])

  // Filter clients by search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clientList

    const term = searchTerm.toLowerCase().trim()
    return clientList.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.telefone.toLowerCase().includes(term)
    )
  }, [clientList, searchTerm])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CL'
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[34px] font-bold text-[#F8FAFC] tracking-tight">
            Clientes
          </h1>
          <p className="text-[14px] leading-[17px] font-normal text-[#A8B0C0] mt-1.5">
            Gerencie contatos e projetos vinculados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-[174px] h-[44px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#F8FAFC] font-semibold text-[13px] leading-[16px] rounded-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25 active:scale-[0.99] transition-all shrink-0"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>Novo cliente</span>
        </button>
      </div>

      {/* Search Bar: 1104px x 52px, bg: #151820, rounded: 10px */}
      <div className="w-full h-[52px] bg-[#151820] border border-[#2E3440]/60 rounded-[10px] px-4 flex items-center gap-3 transition-colors focus-within:border-[#8B5CF6]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#788194"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="w-full h-full bg-transparent text-[13px] leading-[16px] text-[#F8FAFC] placeholder-[#788194] focus:outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs text-[#788194] hover:text-[#F8FAFC] cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Clients Table Container: 1104px x 586px, bg: #1A1D24, rounded: 16px */}
      <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-6 shadow-md overflow-x-auto">
        {/* Table Headers */}
        {!isLoading && filteredClients.length > 0 && (
          <div className="grid grid-cols-12 gap-4 pb-4 border-b border-[#343946]/50 min-w-[760px]">
            <div className="col-span-4 text-[11px] leading-[13px] font-semibold text-[#788194] tracking-wider uppercase pl-2">
              CLIENTE
            </div>
            <div className="col-span-4 text-[11px] leading-[13px] font-semibold text-[#788194] tracking-wider uppercase">
              CONTATO
            </div>
            <div className="col-span-2 text-[11px] leading-[13px] font-semibold text-[#788194] tracking-wider uppercase">
              PROJETOS
            </div>
            <div className="col-span-2 text-[11px] leading-[13px] font-semibold text-[#788194] tracking-wider uppercase flex items-center justify-between pr-2">
              <span>ÚLTIMA ATIVIDADE</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#A8B0C0]">
            <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Carregando clientes...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClients.length === 0 && (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#242832] flex items-center justify-center text-[#788194]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#F8FAFC]">
                Nenhum cliente encontrado
              </h3>
              <p className="text-[13px] text-[#788194] mt-1">
                {searchTerm
                  ? `Não há clientes correspondentes à pesquisa "${searchTerm}".`
                  : 'Cadastre seu primeiro cliente para organizar projetos e contatos.'}
              </p>
            </div>
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="mt-1 px-3.5 py-1.5 bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer"
              >
                Limpar busca
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-1 px-4 py-2 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A78BFA] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer"
              >
                + Cadastrar primeiro cliente
              </button>
            )}
          </div>
        )}

        {/* Clients List Rows */}
        {!isLoading && filteredClients.length > 0 && (
          <div className="flex flex-col min-w-[760px]">
            {filteredClients.map((client, index) => {
              const isLast = index === filteredClients.length - 1

              return (
                <div key={client.id}>
                  <div
                    onClick={() => handleOpenClient(client.id)}
                    className="py-4.5 grid grid-cols-12 gap-4 items-center group hover:bg-[#242832]/30 rounded-[10px] px-2 transition-colors cursor-pointer"
                  >
                    {/* Column 1: Avatar + Name + Subtitle (col-span-4) */}
                    <div className="col-span-4 flex items-center gap-4 min-w-0">
                      {/* Avatar: 46x46, rounded-full */}
                      <div
                        className={`w-[46px] h-[46px] rounded-full ${client.avatarBg} flex items-center justify-center shrink-0 shadow-sm shadow-black/20 text-[#F8FAFC] font-semibold text-[13px]`}
                      >
                        {getInitials(client.nome)}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] leading-[17px] font-semibold text-[#F8FAFC] truncate group-hover:text-[#A78BFA] transition-colors">
                          {client.nome}
                        </span>
                        <span className="text-[11px] leading-[13px] font-normal text-[#788194] mt-1 truncate">
                          {client.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Email + Phone (col-span-4) */}
                    <div className="col-span-4 flex flex-col min-w-0">
                      <span className="text-[12px] leading-[15px] font-medium text-[#F8FAFC] truncate">
                        {client.email}
                      </span>
                      <span className="text-[11px] leading-[13px] font-normal text-[#A8B0C0] mt-1 truncate">
                        {client.telefone}
                      </span>
                    </div>

                    {/* Column 3: Projetos count (col-span-2) */}
                    <div className="col-span-2">
                      <span className="text-[12px] leading-[15px] font-semibold text-[#C4B5FD]">
                        {client.projetosCount} {client.projetosCount === 1 ? 'projeto' : 'projetos'}
                      </span>
                    </div>

                    {/* Column 4: Última Atividade + Menu ••• (col-span-2) */}
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-[12px] leading-[15px] font-normal text-[#A8B0C0]">
                        {client.ultimaAtividade}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenClient(client.id)
                        }}
                        className="text-[14px] leading-[17px] font-bold text-[#A8B0C0] hover:text-[#F8FAFC] p-1 cursor-pointer transition-colors"
                        title="Ver detalhes do cliente"
                      >
                        •••
                      </button>
                    </div>
                  </div>

                  {/* Divider line between rows: 1px #343946 */}
                  {!isLast && <div className="h-[1px] w-full bg-[#343946]" />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Novo Cliente */}
      <NovoClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Drawer Detalhes do Cliente */}
      <ClienteDetalhesDrawer
        clienteId={activeClienteId}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}
