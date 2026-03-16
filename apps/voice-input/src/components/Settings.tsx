import { useState, useEffect } from 'react'
import type { Lang, ThemePref, Mode } from '../utils/storage'
import { AVAILABLE_MODELS } from '../utils/storage'
import { t } from '../utils/i18n'
import './Settings.css'

interface Props {
  lang: Lang
  themePref: ThemePref
  apiKey: string
  dictionary: string
  customInstructions: string
  modes: Mode[]
  model: string
  open: boolean
  onClose: () => void
  onSave: (key: string) => void
  onDelete: () => void
  onDictionarySave: (dict: string) => void
  onCustomInstructionsSave: (text: string) => void
  onModesSave: (modes: Mode[]) => void
  onModelChange: (model: string) => void
  onLangChange: (lang: Lang) => void
  onThemeChange: (pref: ThemePref) => void
}

export function Settings({
  lang, themePref, apiKey, dictionary, customInstructions, modes, model,
  open, onClose, onSave, onDelete, onDictionarySave,
  onCustomInstructionsSave, onModesSave, onModelChange, onLangChange, onThemeChange,
}: Props) {
  const [key, setKey] = useState(apiKey)
  const [show, setShow] = useState(false)
  const [dict, setDict] = useState(dictionary)
  const [customInstr, setCustomInstr] = useState(customInstructions)
  const [localModes, setLocalModes] = useState<Mode[]>(modes)
  const [expandedMode, setExpandedMode] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleSave = () => {
    if (key.trim()) onSave(key.trim())
    onDictionarySave(dict)
    onCustomInstructionsSave(customInstr)
    onModesSave(localModes)
    onClose()
  }

  const updateModeField = (id: string, field: 'name' | 'instructions', value: string) => {
    setLocalModes(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const addMode = () => {
    const id = crypto.randomUUID()
    const newMode: Mode = { id, name: '', instructions: '' }
    setLocalModes(prev => [...prev, newMode])
    setExpandedMode(id)
  }

  const removeMode = (id: string) => {
    setLocalModes(prev => prev.filter(m => m.id !== id))
    if (expandedMode === id) setExpandedMode(null)
  }

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2 className="settings-title">{t(lang, 'settings')}</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          {/* ── Primary settings ── */}

          {/* API Key */}
          <div className="settings-field">
            <label className="settings-label">{t(lang, 'apiKeyLabel')}</label>
            <div className="settings-input-wrap">
              <input
                className="settings-input"
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza..."
              />
              <button
                type="button"
                className="settings-toggle"
                onClick={() => setShow(!show)}
              >
                {show ? t(lang, 'hide') : t(lang, 'show')}
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="settings-field">
            <label className="settings-label">{t(lang, 'themeLabel')}</label>
            <div className="settings-lang-row">
              <button
                className={`settings-lang-btn ${themePref === 'auto' ? 'active' : ''}`}
                onClick={() => onThemeChange('auto')}
              >
                {t(lang, 'themeAuto')}
              </button>
              <button
                className={`settings-lang-btn ${themePref === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                {t(lang, 'themeDark')}
              </button>
              <button
                className={`settings-lang-btn ${themePref === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                {t(lang, 'themeLight')}
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="settings-field">
            <label className="settings-label">{t(lang, 'languageLabel')}</label>
            <div className="settings-lang-row">
              <button
                className={`settings-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => onLangChange('en')}
              >
                English
              </button>
              <button
                className={`settings-lang-btn ${lang === 'zh' ? 'active' : ''}`}
                onClick={() => onLangChange('zh')}
              >
                中文
              </button>
            </div>
          </div>

          {/* ── Advanced settings (collapsible) ── */}
          <div className="settings-divider" />

          <button
            className="settings-advanced-toggle"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            <span>{t(lang, 'advancedSettings')}</span>
            <svg
              className={`settings-advanced-chevron ${advancedOpen ? 'open' : ''}`}
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {advancedOpen && (
            <div className="settings-advanced-body">
              {/* Model */}
              <div className="settings-field">
                <label className="settings-label">{t(lang, 'modelLabel')}</label>
                <select
                  className="settings-select"
                  value={model}
                  onChange={(e) => onModelChange(e.target.value)}
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Dictionary */}
              <div className="settings-field">
                <label className="settings-label">{t(lang, 'dictionaryLabel')}</label>
                <p className="settings-hint">{t(lang, 'dictionaryHint')}</p>
                <textarea
                  className="settings-textarea"
                  value={dict}
                  onChange={(e) => setDict(e.target.value)}
                  placeholder={t(lang, 'dictionaryPlaceholder')}
                  rows={4}
                  spellCheck={false}
                />
              </div>

              {/* Custom Instructions */}
              <div className="settings-field">
                <label className="settings-label">{t(lang, 'customInstructionsLabel')}</label>
                <p className="settings-hint">{t(lang, 'customInstructionsHint')}</p>
                <textarea
                  className="settings-textarea"
                  value={customInstr}
                  onChange={(e) => setCustomInstr(e.target.value)}
                  placeholder={t(lang, 'customInstructionsPlaceholder')}
                  rows={3}
                  spellCheck={false}
                />
              </div>

              {/* Modes */}
              <div className="settings-field">
                <label className="settings-label">{t(lang, 'modesLabel')}</label>
                <p className="settings-hint">{t(lang, 'modesHint')}</p>
                <div className="modes-list">
                  {localModes.map(mode => {
                    const isExpanded = expandedMode === mode.id
                    return (
                      <div key={mode.id} className={`mode-card ${isExpanded ? 'expanded' : ''}`}>
                        <button
                          className="mode-card-header"
                          onClick={() => setExpandedMode(isExpanded ? null : mode.id)}
                        >
                          <span className="mode-name">
                            {mode.name || t(lang, 'modePlaceholderName')}
                          </span>
                          {!isExpanded && mode.instructions && (
                            <span className="mode-preview">{mode.instructions}</span>
                          )}
                          <svg
                            className={`mode-chevron ${isExpanded ? 'open' : ''}`}
                            width="14" height="14" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="mode-card-body">
                            {!mode.builtin && (
                              <input
                                className="settings-input mode-name-input"
                                value={mode.name}
                                onChange={(e) => updateModeField(mode.id, 'name', e.target.value)}
                                placeholder={t(lang, 'modePlaceholderName')}
                              />
                            )}
                            <textarea
                              className="settings-textarea mode-instr-textarea"
                              value={mode.instructions}
                              onChange={(e) => updateModeField(mode.id, 'instructions', e.target.value)}
                              placeholder={t(lang, 'modePlaceholderInstr')}
                              rows={3}
                            />
                            {!mode.builtin && (
                              <button
                                className="mode-delete-btn"
                                onClick={() => removeMode(mode.id)}
                              >
                                {t(lang, 'deleteMode')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <button className="mode-add-btn" onClick={addMode}>
                    + {t(lang, 'addMode')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="settings-actions">
            <button className="settings-save" onClick={handleSave} disabled={!key.trim()}>
              {t(lang, 'save')}
            </button>
            <button className="settings-danger" onClick={onDelete}>
              {t(lang, 'deleteKey')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
