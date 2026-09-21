import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProjetos } from '../hooks/useProjetos.ts'
import { useVersoes } from '../hooks/useVersoes.ts'
import { useComentarios } from '../hooks/useComentarios.ts'

export function ComentariosPage() {
  const navigate = useNavigate()
  const { data: projetos, isLoading: isProjetosLoading } = useProjetos()

  // Seleção de Projeto
  const [selectedProjetoId, setSelectedProjetoId] = useState<string>('')

  // Atualiza projeto selecionado inicial quando a lista de projetos carregar
  const activeProjetoId = useMemo(() => {
    if (selectedProjetoId) return selectedProjetoId
    if (projetos && projetos.length > 0 && projetos[0].id) {
      return projetos[0].id
    }
    return ''
  }, [selectedProjetoId, projetos])

  // Busca versões do projeto ativo
  const { data: versoes, isLoading: isVersoesLoading } = useVersoes(activeProjetoId || undefined)

  // Seleção de Versão
  const [selectedVersaoId, setSelectedVersaoId] = useState<string>('')

  const activeVersaoId = useMemo(() => {
    if (selectedVersaoId) return selectedVersaoId
    if (versoes && versoes.length > 0 && versoes[0].id) {
      return versoes[versoes.length - 1].id! // Padrão: versão mais recente
    }
    return ''
  }, [selectedVersaoId, versoes])

  // Busca comentários da versão ativa
  const { data: comentarios, isLoading: isComentariosLoading } = useComentarios(activeVersaoId || undefined)

  // Filtros de busca e autor
  const [searchTerm, setSearchTerm] = useState('')
  const [autorFilter, setAutorFilter] = useState<'TODOS' | 'CLIENTE' | 'PROFISSIONAL'>('TODOS')

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Comentários filtrados
  const filteredComentarios = useMemo(() => {
    if (!comentarios) return []
    return comentarios.filter((c) => {
      // Filtro de autor
      if (autorFilter === 'CLIENTE' && c.autorTipo !== 'CLIENTE') return false
      if (autorFilter === 'PROFISSIONAL' && c.autorTipo === 'CLIENTE') return false

      // Busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        return (c.texto || '').toLowerCase().includes(term)
      }

      return true
    })
  }, [comentarios, autorFilter, searchTerm])

  const currentProjeto = projetos?.find((p) => p.id === activeProjetoId)
  const currentVersao = versoes?.find((v) => v.id === activeVersaoId)

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#F8FAFC] tracking-tight">
            Comentários e Feedbacks
          </h1>
          <p className="text-[14px] text-[#A8B0C0] mt-1">
            Centralize e filtre todas as anotações por timecode deixadas nos seus projetos.
          </p>
        </div>

        {activeProjetoId && activeVersaoId && (
          <button
            type="button"
            onClick={() => navigate(`/projetos/${activeProjetoId}/versoes/${activeVersaoId}`)}
            className="h-[40px] px-4 rounded-[10px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[13px] font-semibold flex items-center gap-2 transition-all shadow-md shadow-purple-900/25 cursor-pointer self-start sm:self-auto"
          >
            <span>Abrir Revisão da Versão</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Quando não há projetos cadastrados */}
      {isProjetosLoading ? (
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
              <h3 className="text-[16px] font-bold text-[#F8FAFC]">Nenhum projeto encontrado</h3>
              <p className="text-[13px] text-[#788194] mt-1">
                Crie seu primeiro projeto para subir versões de vídeo e coletar comentários por timecode.
              </p>
            </div>
            <Link
              to="/projetos"
              className="mt-1 px-4 py-2 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A78BFA] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer"
            >
              + Ir para Projetos
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Toolbar */}
          <div className="bg-[#1A1D24] border border-[#2E3440] rounded-[16px] p-5 flex flex-col gap-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dropdown Projeto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#A8B0C0] uppercase tracking-wider">
                  Projeto
                </label>
                <select
                  value={activeProjetoId}
                  onChange={(e) => {
                    setSelectedProjetoId(e.target.value)
                    setSelectedVersaoId('')
                  }}
                  disabled={isProjetosLoading || !projetos || projetos.length === 0}
                  className="h-[42px] bg-[#12151C] border border-[#2E3440] rounded-[10px] px-3 text-[13px] text-[#F8FAFC] outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer"
                >
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1A1D24]">
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Versão */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#A8B0C0] uppercase tracking-wider">
                  Versão
                </label>
                <select
                  value={activeVersaoId}
                  onChange={(e) => setSelectedVersaoId(e.target.value)}
                  disabled={isVersoesLoading || !versoes || versoes.length === 0}
                  className="h-[42px] bg-[#12151C] border border-[#2E3440] rounded-[10px] px-3 text-[13px] text-[#F8FAFC] outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer"
                >
                  {versoes && versoes.length > 0 ? (
                    versoes.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#1A1D24]">
                        Versão {v.numero} ({v.status || 'DISPONIVEL'})
                      </option>
                    ))
                  ) : (
                    <option value="">Nenhuma versão cadastrada</option>
                  )}
                </select>
              </div>

              {/* Busca textual */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#A8B0C0] uppercase tracking-wider">
                  Buscar no comentário
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por palavras..."
                    className="w-full h-[42px] bg-[#12151C] border border-[#2E3440] rounded-[10px] pl-9 pr-3 text-[13px] text-[#F8FAFC] placeholder-[#667085] outline-none focus:border-[#8B5CF6] transition-colors"
                  />
                  <span className="absolute left-3 top-3 text-[#667085]">🔍</span>
                </div>
              </div>
            </div>

            {/* Autor Filter Pills */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#2E3440]/60 flex-wrap">
              <span className="text-[11px] font-semibold text-[#A8B0C0] uppercase mr-2">Autor:</span>
              {(['TODOS', 'CLIENTE', 'PROFISSIONAL'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setAutorFilter(tipo)}
                  className={`px-3 py-1 rounded-[8px] text-[12px] font-semibold transition-colors cursor-pointer ${
                    autorFilter === tipo
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'bg-[#12151C] text-[#A8B0C0] hover:text-white border border-[#2E3440]'
                  }`}
                >
                  {tipo === 'TODOS' ? 'Todos' : tipo === 'CLIENTE' ? 'Apenas Clientes' : 'Apenas Profissional'}
                </button>
              ))}
            </div>
          </div>

          {/* Results Header */}
          {versoes && versoes.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] text-[#A8B0C0]">
                {filteredComentarios.length} {filteredComentarios.length === 1 ? 'comentário encontrado' : 'comentários encontrados'}
                {currentProjeto ? ` em ${currentProjeto.nome}` : ''}
                {currentVersao ? ` (V${currentVersao.numero})` : ''}
              </span>
            </div>
          )}

          {/* Comments List Grid */}
          {isComentariosLoading || isVersoesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-[#1A1D24] rounded-[14px] animate-pulse" />
              ))}
            </div>
          ) : !versoes || versoes.length === 0 ? (
            <div className="bg-[#1A1D24] border border-[#2E3440] rounded-[16px] p-5 sm:p-6 shadow-sm">
              <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#242832] flex items-center justify-center text-[#788194]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#F8FAFC]">Nenhuma versão cadastrada</h3>
                  <p className="text-[13px] text-[#788194] mt-1">
                    Este projeto ainda não possui nenhuma versão de vídeo cadastrada para receber comentários.
                  </p>
                </div>
                {activeProjetoId && (
                  <Link
                    to={`/projetos/${activeProjetoId}`}
                    className="mt-1 px-4 py-2 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A78BFA] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer"
                  >
                    Abrir projeto para adicionar versão →
                  </Link>
                )}
              </div>
            </div>
          ) : filteredComentarios.length === 0 ? (
            <div className="bg-[#1A1D24] border border-[#2E3440] rounded-[16px] p-5 sm:p-6 shadow-sm">
              <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#242832] flex items-center justify-center text-[#788194]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#F8FAFC]">Nenhum comentário encontrado</h3>
                  <p className="text-[13px] text-[#788194] mt-1">
                    {searchTerm
                      ? `Não há comentários correspondentes à pesquisa "${searchTerm}".`
                      : 'Esta versão ainda não possui anotações de clientes ou profissionais.'}
                  </p>
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="mt-1 px-3.5 py-1.5 bg-[#242832] hover:bg-[#2E3440] text-[#E2E5EA] rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer"
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredComentarios.map((comment) => {
            const sec = comment.timestampSegundos ?? 0
            const isClient = comment.autorTipo === 'CLIENTE'

            return (
              <div
                key={comment.id || `comment-${sec}`}
                className="bg-[#1A1D24] border border-[#2E3440] hover:border-[#8B5CF6]/50 rounded-[14px] p-4.5 flex flex-col justify-between gap-3 shadow-sm transition-all group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    {/* Timecode Link */}
                    <Link
                      to={`/projetos/${activeProjetoId}/versoes/${activeVersaoId}?t=${sec}`}
                      className="h-[26px] px-2.5 rounded-[6px] bg-[#242832] hover:bg-[#8B5CF6] text-[#A78BFA] hover:text-white font-mono text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir vídeo neste timecode"
                    >
                      <span>⏱</span>
                      <span>{formatTimecode(sec)}</span>
                    </Link>

                    {/* Author Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        isClient
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                          : 'bg-[#6366F1]/15 text-[#C4B5FD] border-[#6366F1]/30'
                      }`}
                    >
                      {isClient ? 'Cliente' : 'Profissional'}
                    </span>
                  </div>

                  <p className="text-[13px] leading-relaxed text-[#E2E5EA]">
                    {comment.texto}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#2E3440]/50 flex items-center justify-between text-[11px] text-[#A8B0C0]">
                  <span>
                    {currentProjeto?.nome} · V{currentVersao?.numero}
                  </span>

                  <Link
                    to={`/projetos/${activeProjetoId}/versoes/${activeVersaoId}?t=${sec}`}
                    className="text-[#A78BFA] hover:text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Ir para o vídeo</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
        </>
      )}
    </div>
  )
}
