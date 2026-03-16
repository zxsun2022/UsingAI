import { useMemo } from 'react'
import type { Session, Lang } from '../utils/storage'
import { t } from '../utils/i18n'
import './Sidebar.css'

interface Props {
  lang: Lang
  open: boolean
  sessions: Session[]
  activeSessionId: string
  onSelectSession: (session: Session) => void
  onDeleteSession: (session: Session) => void
  onToggle: () => void
}

function formatRelativeTime(dateStr: string, lang: Lang): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return t(lang, 'justNow')
  if (diffMin < 60) return t(lang, 'minutesAgo').replace('{n}', String(diffMin))
  if (diffHr < 24) return t(lang, 'hoursAgo').replace('{n}', String(diffHr))
  if (diffDay < 2) return t(lang, 'yesterday')
  return t(lang, 'daysAgo').replace('{n}', String(diffDay))
}

function sessionTitle(session: Session): string {
  const text = session.text.trim()
  if (!text) return '…'
  const firstLine = text.split('\n')[0]
  return firstLine.length > 24 ? firstLine.slice(0, 24) + '…' : firstLine
}

export function Sidebar({
  lang,
  open,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onToggle,
}: Props) {
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [sessions],
  )

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onToggle} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">{t(lang, 'history')}</span>
          <button className="sidebar-close-btn" onClick={onToggle} aria-label="Close sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="sidebar-list">
          {sortedSessions.length === 0 ? (
            <p className="sidebar-empty">{t(lang, 'noHistory')}</p>
          ) : (
            sortedSessions.map((s) => (
              <div
                key={s.id}
                className={`sidebar-item ${s.id === activeSessionId ? 'sidebar-item-active' : ''}`}
                onClick={() => onSelectSession(s)}
              >
                <div className="sidebar-item-content">
                  <span className="sidebar-item-title">{sessionTitle(s)}</span>
                  <span className="sidebar-item-time">{formatRelativeTime(s.updatedAt, lang)}</span>
                </div>
                <button
                  className="sidebar-item-delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(s)
                  }}
                  aria-label="Delete session"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

      </aside>
    </>
  )
}
