import { useState, useCallback, type ReactNode } from 'react'
import { ToastContext, type ToastType } from './toast-context.ts'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev, { id, type, message }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: useCallback((msg: string) => addToast('success', msg), [addToast]),
    error: useCallback((msg: string) => addToast('error', msg), [addToast]),
    info: useCallback((msg: string) => addToast('info', msg), [addToast]),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[380px] w-full px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success'
          const isError = t.type === 'error'

          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-[12px] p-4 flex items-start gap-3 shadow-2xl border transition-all animate-in slide-in-from-bottom-2 duration-200 ${
                isSuccess
                  ? 'bg-[#12151C] border-[#10B981]/50 text-[#F8FAFC]'
                  : isError
                  ? 'bg-[#12151C] border-[#EF4444]/50 text-[#F8FAFC]'
                  : 'bg-[#12151C] border-[#8B5CF6]/50 text-[#F8FAFC]'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isSuccess
                    ? 'bg-[#10B981]/20 text-[#10B981]'
                    : isError
                    ? 'bg-[#EF4444]/20 text-[#EF4444]'
                    : 'bg-[#8B5CF6]/20 text-[#A78BFA]'
                }`}
              >
                {isSuccess ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isError ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>

              {/* Message */}
              <p className="text-[13px] leading-snug font-medium text-[#F8FAFC] flex-1 mt-0.5">
                {t.message}
              </p>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-[#A8B0C0] hover:text-white transition-colors cursor-pointer shrink-0 -mr-1"
                aria-label="Fechar notificação"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
