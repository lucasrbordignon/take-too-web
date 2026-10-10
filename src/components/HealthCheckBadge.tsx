import { useHealthCheck } from '../hooks/useHealth.ts'

export function HealthCheckBadge() {
  const { data, isError, isLoading, isFetching, refetch } = useHealthCheck()
  const configuredApi = import.meta.env.VITE_API_URL || 'http://localhost:8082'
  const apiLabel = (() => {
    try { return new URL(configuredApi).port || new URL(configuredApi).host } catch { return configuredApi }
  })()

  return (
    <div className="flex items-center gap-2 bg-bg-surface/80 backdrop-blur px-3 py-1.5 rounded-full border border-border-subtle/50 text-xs shadow-md">
      {isLoading ? (
        <>
          <span className="w-2 h-2 rounded-full bg-status-warning animate-ping" />
          <span className="text-text-secondary text-[11px]">Verificando API...</span>
        </>
      ) : isError ? (
        <>
          <span className="w-2 h-2 rounded-full bg-status-danger" />
          <span className="text-status-danger font-medium text-[11px]">API Offline ({apiLabel})</span>
          <button
            onClick={() => refetch()}
            title="Tentar reconectar"
            className="text-[10px] text-text-secondary hover:text-text-primary underline ml-1 cursor-pointer"
          >
            retestar
          </button>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="text-status-success font-medium text-[11px]">
            API Online {data && typeof data === 'object' && 'status' in data ? `(${String(data.status)})` : ''}
          </span>
          <button
            onClick={() => refetch()}
            title="Atualizar status da API"
            className={`text-text-secondary/60 hover:text-text-primary ml-1 cursor-pointer transition-transform ${
              isFetching ? 'animate-spin' : ''
            }`}
          >
            ↻
          </button>
        </>
      )}
    </div>
  )
}
