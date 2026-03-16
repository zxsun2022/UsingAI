import { useEffect } from 'react'
import './Toast.css'

interface Props {
  message: string
  type: 'success' | 'error'
  actionLabel?: string
  onAction?: () => void
  duration?: number
  onClose: () => void
}

export function Toast({ message, type, actionLabel, onAction, duration = 3500, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">{type === 'success' ? '✓' : '!'}</span>
      <span className="toast-msg">{message}</span>
      {actionLabel && onAction && (
        <button className="toast-action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}
