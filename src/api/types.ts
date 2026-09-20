export type StatusProjeto =
  | 'GRAVACAO_CONCLUIDA'
  | 'EM_EDICAO'
  | 'REVISAO_CLIENTE'
  | 'APROVADO'
  | 'ENTREGUE'

export type StatusVersao =
  | 'DISPONIVEL'
  | 'APROVADA'
  | 'REJEITADA'

export interface ComentarioCreateDTO {
  texto: string
  tempoVideo?: number
}

export interface ComentarioDTO {
  id?: string
  texto?: string
  timestampSegundos?: number
  autorTipo?: string
  criadoEm?: string
}

export interface ClienteCreateDTO {
  nome: string
  telefone: string
  email?: string
}

export interface ClienteDTO {
  id?: string
  nome?: string
  telefone?: string
  email?: string
  criadoEm?: string
  totalProjetos?: number
  ultimaAtividadeEm?: string | null
}

export type Cliente = ClienteDTO


export interface ProjetoCreateDTO {
  nome: string
  clienteId: string
}

export interface ProjetoDTO {
  id?: string
  nome?: string
  etapaAtual?: StatusProjeto
  cliente?: ClienteDTO
  criadoEm?: string
  atualizadoEm?: string
  magicLinkAtivo?: boolean
}

export interface VersaoCreateDTO {
  arquivoUrl: string
}

export interface VersaoDTO {
  id?: string
  numero?: number
  arquivoUrl?: string
  status?: StatusVersao | string
  criadoEm?: string
}

export interface RegisterRequestDTO {
  nome: string
  email: string
  senha: string
  plano: string
}

export interface LoginRequestDTO {
  email: string
  senha: string
}

export interface MagicLinkRequestDTO {
  projetoId: string
}

export interface TokenResponseDTO {
  token?: string
  refreshToken?: string
}

export interface StatusProjetoUpdateDTO {
  status: StatusProjeto
}

export interface StatusVersaoUpdateDTO {
  status: StatusVersao
}

export interface ProfissionalDTO {
  id?: string
  nome?: string
  email?: string
  plano?: string
}

export type TipoAtividade =
  | 'PROJETO_CRIADO'
  | 'VERSAO_PUBLICADA'
  | 'VERSAO_APROVADA'
  | 'VERSAO_REJEITADA'
  | 'COMENTARIO_ADICIONADO'

export type AutorTipo = 'PROFISSIONAL' | 'CLIENTE' | 'SISTEMA'

export interface AtividadeDTO {
  id: string
  tipo: TipoAtividade
  titulo: string
  descricao?: string
  autor: string
  autorTipo: AutorTipo
  timestamp: string
  versaoId?: string
  versaoNumero?: number
  tempoVideo?: string
}

export interface DashboardMetricasDTO {
  totalProjetos: number
  projetosEmAndamento: number
  aguardandoAprovacao: number
  concluidos: number
  totalClientes: number
  projetosNovosEstaSemana: number
  aguardandoMaisDeDoisDias: number
  concluidosEsteMes: number
  projetosRecentes: ProjetoDTO[]
}


