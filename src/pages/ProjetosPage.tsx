import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjetos } from '../hooks/useProjetos.ts'
import { NovoProjetoModal } from '../components/NovoProjetoModal.tsx'
import type { StatusProjeto } from '../api/types.ts'

const statusLabels: Record<StatusProjeto, { label: string; badgeClass: string }> = {
  GRAVACAO_CONCLUIDA: { label: 'Gravação Concluída', badgeClass: 'bg-[#6366F1]/15 text-[#C4B5FD] border-[#6366F1]/30' },
  EM_EDICAO: { label: 'Em Edição', badgeClass: 'bg-[#8B5CF6]/15 text-[#C4B5FD] border-[#8B5CF6]/30' },
  REVISAO_CLIENTE: { label: 'Revisão do Cliente', badgeClass: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30' },
  APROVADO: { label: 'Aprovado', badgeClass: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' },
  ENTREGUE: { label: 'Entregue', badgeClass: 'bg-[#242832] text-[#A8B0C0] border-[#343946]' },
}

export function ProjetosPage() {
  const { data: projetos, isLoading: isLoadingProjetos } = useProjetos()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#F8FAFC] tracking-tight">
            Projetos
          </h1>
          <p className="text-[14px] text-[#A8B0C0] mt-1">
            Gerencie revisões, versões e aprovações de clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-[40px] px-4 rounded-[10px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[13px] font-semibold flex items-center gap-2 transition-all shadow-md shadow-purple-900/25 cursor-pointer self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Content */}
      {isLoadingProjetos ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#A8B0C0]">
          <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Carregando projetos...</span>
        </div>
      ) : !projetos || projetos.length === 0 ? (
        <div className="bg-[#1A1D24] border border-[#2E3440] rounded-[16px] p-5 sm:p-6 shadow-sm">
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#242832] flex items-center justify-center text-[#788194]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#F8FAFC]">
                Nenhum projeto encontrado
              </h3>
              <p className="text-[13px] text-[#788194] mt-1">
                Crie seu primeiro projeto para subir versões de vídeo e coletar feedbacks por timecode.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-1 px-4 py-2 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A78BFA] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer"
            >
              + Criar primeiro projeto
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projetos.map((projeto) => {
            const statusConfig = projeto.etapaAtual ? statusLabels[projeto.etapaAtual] : null
            return (
              <Link
                key={projeto.id}
                to={`/projetos/${projeto.id}`}
                className="bg-[#1A1D24] hover:bg-[#20242D] border border-[#2E3440] hover:border-[#8B5CF6]/50 rounded-[16px] p-5 flex flex-col justify-between gap-4 transition-all shadow-sm group cursor-pointer"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors line-clamp-1">
                      {projeto.nome}
                    </h3>
                    {statusConfig && (
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${statusConfig.badgeClass}`}>
                        {statusConfig.label}
                      </span>
                    )}
                  </div>

                  {projeto.cliente && (
                    <span className="text-xs text-[#A8B0C0] flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {projeto.cliente.nome}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-[#2E3440]/60 flex items-center justify-between text-xs text-[#788194]">
                  <span className="font-mono">ID: {projeto.id?.slice(0, 8)}...</span>
                  <span className="text-[#A78BFA] font-medium group-hover:translate-x-0.5 transition-transform">
                    Ver detalhes →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal Criar Projeto */}
      <NovoProjetoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
