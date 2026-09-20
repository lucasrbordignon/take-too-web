import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjetos } from '../hooks/useProjetos.ts'
import { NovoProjetoModal } from '../components/NovoProjetoModal.tsx'
import type { StatusProjeto } from '../api/types.ts'

const statusLabels: Record<StatusProjeto, { label: string; badgeClass: string }> = {
  GRAVACAO_CONCLUIDA: { label: 'Gravação Concluída', badgeClass: 'bg-brand-indigo/20 text-brand-indigo border-brand-indigo/30' },
  EM_EDICAO: { label: 'Em Edição', badgeClass: 'bg-brand-primary/20 text-brand-light border-brand-primary/30' },
  REVISAO_CLIENTE: { label: 'Revisão do Cliente', badgeClass: 'bg-status-warning/20 text-status-warning border-status-warning/30' },
  APROVADO: { label: 'Aprovado', badgeClass: 'bg-status-success/20 text-status-success border-status-success/30' },
  ENTREGUE: { label: 'Entregue', badgeClass: 'bg-text-secondary/20 text-text-primary border-text-secondary/30' },
}

export function ProjetosPage() {
  const { data: projetos, isLoading: isLoadingProjetos } = useProjetos()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-bold text-text-primary tracking-tight">
            Projetos
          </h1>
          <p className="text-body text-text-secondary text-sm">
            Gerencie revisões, versões e aprovações de clientes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4 rounded-[10px] bg-brand-primary hover:bg-[#7c4def] text-text-primary text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-primary/20 cursor-pointer self-start sm:self-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Projeto
        </button>
      </div>

      {/* Content */}
      {isLoadingProjetos ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-text-secondary">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Carregando projetos...</span>
        </div>
      ) : !projetos || projetos.length === 0 ? (
        <div className="bg-bg-surface border border-border-subtle/40 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-primary/30 p-3.5 flex items-center justify-center shadow-lg shadow-purple-600/10">
            <img src="/logo.png" alt="TakeToo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Nenhum projeto encontrado</h3>
            <p className="text-sm text-text-secondary max-w-sm mt-1">
              Crie seu primeiro projeto para subir versões de vídeo e coletar feedbacks por timecode.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-lg bg-bg-raised hover:bg-brand-primary/20 text-brand-light border border-border-subtle hover:border-brand-primary/40 text-sm font-medium transition-colors cursor-pointer"
          >
            Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projetos.map((projeto) => {
            const statusConfig = projeto.etapaAtual ? statusLabels[projeto.etapaAtual] : null
            return (
              <Link
                key={projeto.id}
                to={`/projetos/${projeto.id}`}
                className="bg-bg-surface hover:bg-bg-surface/80 border border-border-subtle/50 hover:border-brand-primary/40 rounded-[16px] p-5 flex flex-col justify-between gap-4 transition-all shadow-sm group cursor-pointer"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg text-text-primary group-hover:text-brand-light transition-colors line-clamp-1">
                      {projeto.nome}
                    </h3>
                    {statusConfig && (
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${statusConfig.badgeClass}`}>
                        {statusConfig.label}
                      </span>
                    )}
                  </div>

                  {projeto.cliente && (
                    <span className="text-xs text-text-secondary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {projeto.cliente.nome}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-border-subtle/30 flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-mono">ID: {projeto.id?.slice(0, 8)}...</span>
                  <span className="text-brand-light group-hover:translate-x-0.5 transition-transform">
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
