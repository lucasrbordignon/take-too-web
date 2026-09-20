export interface ShowcaseProject {
  id: string
  nome: string
  etapaAtual: string
  criadoEm?: string
  atualizadoEm?: string
}

export interface ShowcaseClient {
  id: string
  nome: string
  subtitle: string
  email: string
  telefone: string
  projetosCount: number
  ultimaAtividade: string
  avatarBg: string
  projetos: ShowcaseProject[]
}

export const SHOWCASE_CLIENTS: ShowcaseClient[] = [
  {
    id: 'showcase-client-1',
    nome: 'Studio Aurora',
    subtitle: 'Cliente desde 2026',
    email: 'contato@studioaurora.com',
    telefone: '+55 15 99876-4321',
    projetosCount: 4,
    ultimaAtividade: 'Hoje, 09:42',
    avatarBg: 'bg-[#8B5CF6]',
    projetos: [
      { id: '1', nome: 'Campanha Aurora', etapaAtual: 'REVISAO_CLIENTE' },
      { id: 'demo-2', nome: 'Teaser Redes Sociais', etapaAtual: 'EM_EDICAO' },
    ],
  },
  {
    id: 'showcase-client-2',
    nome: 'Marina Duarte',
    subtitle: 'Cliente desde 2026',
    email: 'marina@email.com',
    telefone: '+55 11 99120-8840',
    projetosCount: 2,
    ultimaAtividade: 'Ontem, 18:10',
    avatarBg: 'bg-[#6366F1]',
    projetos: [
      { id: '2', nome: 'Casamento Marina & Theo', etapaAtual: 'EM_EDICAO' },
    ],
  },
  {
    id: 'showcase-client-3',
    nome: 'Norte Engenharia',
    subtitle: 'Cliente desde 2026',
    email: 'marketing@norte.com',
    telefone: '+55 19 3402-1120',
    projetosCount: 6,
    ultimaAtividade: '16 set, 14:20',
    avatarBg: 'bg-[#8B5CF6]',
    projetos: [
      { id: '3', nome: 'Filme Institucional 2026', etapaAtual: 'APROVADO' },
    ],
  },
  {
    id: 'showcase-client-4',
    nome: 'Essenza Beauty',
    subtitle: 'Cliente desde 2026',
    email: 'camila@essenza.com',
    telefone: '+55 15 99771-2002',
    projetosCount: 3,
    ultimaAtividade: '15 set, 11:08',
    avatarBg: 'bg-[#6366F1]',
    projetos: [
      { id: '4', nome: 'Lançamento Linha Essenza', etapaAtual: 'GRAVACAO_CONCLUIDA' },
    ],
  },
]
