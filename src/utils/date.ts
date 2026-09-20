/**
 * Utilitários para formatação e manipulação de datas e timestamps.
 */

export function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Recente'

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return 'Recente'

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return 'Agora mesmo' // Caso relógio do servidor esteja alguns ms adiantado

  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 1) return 'Agora mesmo'
  if (diffMins < 60) return `há ${diffMins} min`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `há ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `há ${diffDays} dias`

  // Formato abreviado pt-BR (ex: "20 set")
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function formatDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Data não informada'

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return 'Data inválida'

  const today = new Date()
  const isToday =
    today.getDate() === date.getDate() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  if (isToday) {
    return `Hoje às ${timeStr}`
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    yesterday.getDate() === date.getDate() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getFullYear() === date.getFullYear()

  if (isYesterday) {
    return `Ontem às ${timeStr}`
  }

  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${dateStr}, ${timeStr}`
}

export function formatYear(dateInput?: string | Date | null): string {
  if (!dateInput) return new Date().getFullYear().toString()
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return new Date().getFullYear().toString()
  return date.getFullYear().toString()
}
