import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.ts'
import { useProjetos } from '../hooks/useProjetos.ts'
import { useDashboardMetricas } from '../hooks/useDashboardMetricas.ts'
import { NovoProjetoModal } from '../components/NovoProjetoModal.tsx'
import { formatRelativeTime } from '../utils/date.ts'



const statusStylesMap: Record<
  string,
  { label: string; badgeBg: string; thumbnailBg: string }
> = {
  REVISAO_CLIENTE: {
    label: 'REVISÃO DO CLIENTE',
    badgeBg: 'bg-[#F59E0B]',
    thumbnailBg: 'bg-[#F59E0B]',
  },
  EM_EDICAO: {
    label: 'EM EDIÇÃO',
    badgeBg: 'bg-[#8B5CF6]',
    thumbnailBg: 'bg-[#8B5CF6]',
  },
  APROVADO: {
    label: 'APROVADO',
    badgeBg: 'bg-[#10B981]',
    thumbnailBg: 'bg-[#10B981]',
  },
  GRAVACAO_CONCLUIDA: {
    label: 'GRAVAÇÃO CONCLUÍDA',
    badgeBg: 'bg-[#6366F1]',
    thumbnailBg: 'bg-[#6366F1]',
  },
  ENTREGUE: {
    label: 'ENTREGUE',
    badgeBg: 'bg-[#6B7280]',
    thumbnailBg: 'bg-[#6B7280]',
  },
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data: realProjetos } = useProjetos()
  const { data: metricas, isLoading: carregandoMetricas } = useDashboardMetricas()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // First name greeting
  const firstName = user?.nome ? user.nome.split(' ')[0] : 'Produtor'

  // Metric counts and growth indicators: real backend metrics
  const emAndamentoVal = metricas?.projetosEmAndamento ?? 0
  const novosEstaSemanaVal = metricas?.projetosNovosEstaSemana ?? 0
  const aguardandoVal = metricas?.aguardandoAprovacao ?? 0
  const maisDeDoisDiasVal = metricas?.aguardandoMaisDeDoisDias ?? 0
  const concluidosVal = metricas?.concluidos ?? 0
  const concluidosEsteMesVal = metricas?.concluidosEsteMes ?? 0

  // Display projects: prioritize backend metricas.projetosRecentes, then realProjetos
  const displayProjects = useMemo(() => {
    const rawList =
      metricas?.projetosRecentes && metricas.projetosRecentes.length > 0
        ? metricas.projetosRecentes
        : realProjetos && realProjetos.length > 0
        ? realProjetos.slice(0, 5)
        : []

    if (rawList.length > 0) {
      return rawList.map((proj, idx) => {
        const style =
          statusStylesMap[proj.etapaAtual || ''] || statusStylesMap.EM_EDICAO

        return {
          id: proj.id || String(idx),
          nome: proj.nome || 'Sem título',
          clienteNome: proj.cliente?.nome || 'Cliente',
          status: proj.etapaAtual || 'EM_EDICAO',
          statusLabel: style.label,
          badgeBg: style.badgeBg,
          thumbnailBg: style.thumbnailBg,
          dataLabel: formatRelativeTime(proj.atualizadoEm || proj.criadoEm),
        }
      })
    }

    return []
  }, [metricas, realProjetos])

  return (
    <div className="w-full flex flex-col gap-8 pb-12">
      {/* Top Bar / Greeting & Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[27px] leading-[33px] font-bold text-[#F8FAFC] tracking-tight">
            Bom dia, {firstName} 👋
          </h1>
          <p className="text-[14px] leading-[17px] text-[#A8B0C0] mt-1.5">
            Acompanhe seus projetos e aprovações em um só lugar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-[172px] h-[42px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#F8FAFC] font-semibold text-[13px] leading-[16px] rounded-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25 active:scale-[0.99] transition-all shrink-0"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>Novo projeto</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Em produção */}
        <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-5 h-[132px] flex flex-col justify-between shadow-sm">
          <span className="text-[13px] leading-[16px] font-medium text-[#A8B0C0]">
            Em produção
          </span>
          <span className="text-[32px] leading-[39px] font-bold text-[#F8FAFC]">
            {carregandoMetricas ? '--' : String(emAndamentoVal).padStart(2, '0')}
          </span>
          <span className="text-[12px] leading-[15px] font-medium text-[#10B981]">
            +{novosEstaSemanaVal} esta semana
          </span>
        </div>

        {/* Metric 2: Aguardando aprovação */}
        <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-5 h-[132px] flex flex-col justify-between shadow-sm">
          <span className="text-[13px] leading-[16px] font-medium text-[#A8B0C0]">
            Aguardando aprovação
          </span>
          <span className="text-[32px] leading-[39px] font-bold text-[#F59E0B]">
            {carregandoMetricas ? '--' : String(aguardandoVal).padStart(2, '0')}
          </span>
          {maisDeDoisDiasVal > 0 ? (
            <span className="text-[12px] leading-[15px] font-medium text-[#F59E0B]">
              {maisDeDoisDiasVal} há mais de 2 dias
            </span>
          ) : (
            <span className="text-[12px] leading-[15px] font-medium text-[#788194]">
              Tudo em dia
            </span>
          )}
        </div>

        {/* Metric 3: Concluídos */}
        <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-5 h-[132px] flex flex-col justify-between shadow-sm">
          <span className="text-[13px] leading-[16px] font-medium text-[#A8B0C0]">
            Concluídos
          </span>
          <span className="text-[32px] leading-[39px] font-bold text-[#A78BFA]">
            {carregandoMetricas ? '--' : String(concluidosVal).padStart(2, '0')}
          </span>
          <span className="text-[12px] leading-[15px] font-medium text-[#C4B5FD]">
            +{concluidosEsteMesVal} este mês
          </span>
        </div>
      </div>

      {/* Projetos recentes Card Container */}
      <div className="w-full bg-[#1A1D24] border border-[#343946]/30 rounded-[16px] p-6 flex flex-col shadow-md">
        {/* Header of Section */}
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-[18px] leading-[22px] font-semibold text-[#F8FAFC]">
            Projetos recentes
          </h2>
          <Link
            to="/projetos"
            className="text-[13px] leading-[16px] font-semibold text-[#A78BFA] hover:text-white transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {/* Project rows */}
        {displayProjects.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
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
              <h3 className="text-[16px] font-semibold text-[#F8FAFC]">
                Nenhum projeto recente
              </h3>
              <p className="text-[13px] text-[#788194] mt-1">
                Crie um novo projeto para começar a gerenciar cortes e revisões.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-4 py-2 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A78BFA] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer"
            >
              + Criar primeiro projeto
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
          {displayProjects.map((proj, index) => {
            const isLast = index === displayProjects.length - 1

            return (
              <div key={proj.id}>
                <Link
                  to={`/projetos/${proj.id}`}
                  className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer hover:bg-[#242832]/25 px-2.5 rounded-[10px] transition-colors"
                >
                  {/* Left: Thumbnail & Project info */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail: 96x64 rounded-[10px] */}
                    <div
                      className={`w-[96px] h-[64px] rounded-[10px] ${proj.thumbnailBg} flex items-center justify-center shrink-0 shadow-sm shadow-black/30 group-hover:brightness-105 transition-all`}
                    >
                      {/* Subtle camera/play symbol */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-white/40"
                      >
                        <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm2 0v12h12V6H6zm4 3.5l5 2.5-5 2.5v-5z" />
                      </svg>
                    </div>

                    {/* Title & Client Name */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] leading-[17px] font-semibold text-[#F8FAFC] truncate group-hover:text-[#A78BFA] transition-colors">
                        {proj.nome}
                      </span>
                      <span className="text-[12px] leading-[15px] font-normal text-[#A8B0C0] mt-1.5 truncate">
                        {proj.clienteNome}
                      </span>
                    </div>
                  </div>

                  {/* Right: Badge & Timestamp */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    {/* Status Badge: width ~170px, height 28px, rounded-full */}
                    <div
                      className={`w-[170px] h-[28px] ${proj.badgeBg} rounded-[14px] flex items-center justify-center shrink-0 px-3 shadow-sm`}
                    >
                      <span className="text-[10px] leading-[12px] font-semibold text-[#F8FAFC] tracking-wider text-center select-none uppercase">
                        {proj.statusLabel}
                      </span>
                    </div>

                    {/* Timestamp: 12px, #A8B0C0 */}
                    <span className="text-[12px] leading-[15px] font-normal text-[#A8B0C0] w-[90px] text-right shrink-0">
                      {proj.dataLabel}
                    </span>
                  </div>
                </Link>

                {/* Separator line between rows (1px #343946) */}
                {!isLast && <div className="h-[1px] w-full bg-[#343946]" />}
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Reusable New Project Modal */}
      <NovoProjetoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
