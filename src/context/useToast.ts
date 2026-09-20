import { useContext } from 'react'
import { ToastContext } from './toast-context.ts'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider')
  }
  return context.toast
}
