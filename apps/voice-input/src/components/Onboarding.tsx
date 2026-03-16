import { useState } from 'react'
import type { Lang } from '../utils/storage'
import { t } from '../utils/i18n'
import './Onboarding.css'

interface Props {
  lang: Lang
  onSubmit: (key: string) => void
}

export function Onboarding({ lang, onSubmit }: Props) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (key.trim()) onSubmit(key.trim())
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </div>

        <h1 className="onboarding-title">{t(lang, 'appTitle')}</h1>
        <p className="onboarding-desc">{t(lang, 'onboardingDesc')}</p>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <label className="onboarding-label">{t(lang, 'apiKeyLabel')}</label>
          <div className="onboarding-input-wrap">
            <input
              className="onboarding-input"
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
              autoFocus
            />
            <button
              type="button"
              className="onboarding-toggle"
              onClick={() => setShow(!show)}
              aria-label={show ? t(lang, 'hide') : t(lang, 'show')}
            >
              {show ? t(lang, 'hide') : t(lang, 'show')}
            </button>
          </div>
          <a
            className="onboarding-link"
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t(lang, 'getApiKey')}
          </a>

          <button
            className="onboarding-submit"
            type="submit"
            disabled={!key.trim()}
          >
            {t(lang, 'start')}
          </button>
        </form>

        <p className="onboarding-note">
          {t(lang, 'keyNote')}
        </p>
      </div>
    </div>
  )
}
