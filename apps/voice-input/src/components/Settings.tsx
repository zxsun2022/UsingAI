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
  const [draftLang, setDraftLang] = useState<Lang>(lang)
  const [draftThemePref, setDraftThemePref] = useState<ThemePref>(themePref)
  const [show, setShow] = useState(false)
  const [dict, setDict] = useState(dictionary)
  const [customInstr, setCustomInstr] = useState(customInstructions)
  const [localModes, setLocalModes] = useState<Mode[]>(modes)
  const [draftModel, setDraftModel] = useState(model)
  const [expandedMode, setExpandedMode] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const uiLang = draftLang

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
    onModelChange(draftModel)
    onLangChange(draftLang)
    onThemeChange(draftThemePref)
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
          <h2 className="settings-title">{t(uiLang, 'settings')}</h2>
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
            <label className="settings-label">{t(uiLang, 'apiKeyLabel')}</label>
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
                {show ? t(uiLang, 'hide') : t(uiLang, 'show')}
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="settings-field">
            <label className="settings-label">{t(uiLang, 'themeLabel')}</label>
            <div className="settings-lang-row">
              <button
                className={`settings-lang-btn ${draftThemePref === 'auto' ? 'active' : ''}`}
                onClick={() => setDraftThemePref('auto')}
              >
                {t(uiLang, 'themeAuto')}
              </button>
              <button
                className={`settings-lang-btn ${draftThemePref === 'dark' ? 'active' : ''}`}
                onClick={() => setDraftThemePref('dark')}
              >
                {t(uiLang, 'themeDark')}
              </button>
              <button
                className={`settings-lang-btn ${draftThemePref === 'light' ? 'active' : ''}`}
                onClick={() => setDraftThemePref('light')}
              >
                {t(uiLang, 'themeLight')}
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="settings-field">
            <label className="settings-label">{t(uiLang, 'languageLabel')}</label>
            <div className="settings-lang-row">
              <button
                className={`settings-lang-btn ${draftLang === 'en' ? 'active' : ''}`}
                onClick={() => setDraftLang('en')}
              >
                English
              </button>
              <button
                className={`settings-lang-btn ${draftLang === 'zh' ? 'active' : ''}`}
                onClick={() => setDraftLang('zh')}
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
            <span>{t(uiLang, 'advancedSettings')}</span>
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
                <label className="settings-label">{t(uiLang, 'modelLabel')}</label>
                <select
                  className="settings-select"
                  value={draftModel}
                  onChange={(e) => setDraftModel(e.target.value)}
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Dictionary */}
              <div className="settings-field">
                <label className="settings-label">{t(uiLang, 'dictionaryLabel')}</label>
                <p className="settings-hint">{t(uiLang, 'dictionaryHint')}</p>
                <textarea
                  className="settings-textarea"
                  value={dict}
                  onChange={(e) => setDict(e.target.value)}
                  placeholder={t(uiLang, 'dictionaryPlaceholder')}
                  rows={4}
                  spellCheck={false}
                />
              </div>

              {/* Custom Instructions */}
              <div className="settings-field">
                <label className="settings-label">{t(uiLang, 'customInstructionsLabel')}</label>
                <p className="settings-hint">{t(uiLang, 'customInstructionsHint')}</p>
                <textarea
                  className="settings-textarea"
                  value={customInstr}
                  onChange={(e) => setCustomInstr(e.target.value)}
                  placeholder={t(uiLang, 'customInstructionsPlaceholder')}
                  rows={3}
                  spellCheck={false}
                />
              </div>

              {/* Modes */}
              <div className="settings-field">
                <label className="settings-label">{t(uiLang, 'modesLabel')}</label>
                <p className="settings-hint">{t(uiLang, 'modesHint')}</p>
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
                            {mode.name || t(uiLang, 'modePlaceholderName')}
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
                                placeholder={t(uiLang, 'modePlaceholderName')}
                              />
                            )}
                            <textarea
                              className="settings-textarea mode-instr-textarea"
                              value={mode.instructions}
                              onChange={(e) => updateModeField(mode.id, 'instructions', e.target.value)}
                              placeholder={t(uiLang, 'modePlaceholderInstr')}
                              rows={3}
                            />
                            {!mode.builtin && (
                              <button
                                className="mode-delete-btn"
                                onClick={() => removeMode(mode.id)}
                              >
                                {t(uiLang, 'deleteMode')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <button className="mode-add-btn" onClick={addMode}>
                    + {t(uiLang, 'addMode')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="settings-actions">
            <button className="settings-save" onClick={handleSave} disabled={!key.trim()}>
              {t(uiLang, 'save')}
            </button>
            <button className="settings-danger" onClick={onDelete}>
              {t(uiLang, 'deleteKey')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
