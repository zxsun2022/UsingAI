import { useState, useEffect, useCallback, useRef } from 'react'
import { Onboarding } from './components/Onboarding'
import { TextEditor } from './components/TextEditor'
import { RecordButton } from './components/RecordButton'
import { Settings } from './components/Settings'
import { Toast } from './components/Toast'
import { Sidebar } from './components/Sidebar'
import { useRecorder } from './hooks/useRecorder'
import { useGemini, type GeminiAction } from './hooks/useGemini'
import { t } from './utils/i18n'
import * as store from './utils/storage'
import './App.css'

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(store.getApiKey)
  const [initSession] = useState(() => {
    const existing = store.getCurrentSession()
    if (existing) return existing
    const s = store.createNewSession()
    store.saveSession(s)
    return s
  })
  const [text, setText] = useState(initSession.text)
  const [sessionId, setSessionId] = useState(initSession.id)
  const [createdAt, setCreatedAt] = useState(initSession.createdAt)
  const [themePref, setThemePref] = useState<store.ThemePref>(store.getThemePref)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(store.getResolvedTheme)
  const [lang, setLang] = useState<store.Lang>(store.getLang)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error'; actionLabel?: string; onAction?: () => void; duration?: number } | null>(null)
  const [dictionary, setDictionary] = useState(store.getDictionary)
  const [undoSnapshot, setUndoSnapshot] = useState<string | null>(null)
  const [model, setModel] = useState(store.getModel)
  const [customInstructions, setCustomInstructions] = useState(store.getCustomInstructions)
  const [modes, setModes] = useState<store.Mode[]>(store.getModes)
  const [activeMode, setActiveMode] = useState(store.getActiveMode)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessions, setSessions] = useState<store.Session[]>(store.getSessions)

  const spaceDownRef = useRef(false)
  const textRef = useRef(text)
  const dictionaryRef = useRef(dictionary)
  const customInstructionsRef = useRef(customInstructions)
  const modesRef = useRef(modes)
  const activeModeRef = useRef(activeMode)

  const recorder = useRecorder()
  const gemini = useGemini(apiKey, model)

  useEffect(() => { textRef.current = text }, [text])
  useEffect(() => { dictionaryRef.current = dictionary }, [dictionary])
  useEffect(() => { customInstructionsRef.current = customInstructions }, [customInstructions])
  useEffect(() => { modesRef.current = modes }, [modes])
  useEffect(() => { activeModeRef.current = activeMode }, [activeMode])

  // apply resolved theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  // listen for system theme changes when pref is 'auto'
  useEffect(() => {
    if (themePref !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themePref])

  // auto-save on text change
  useEffect(() => {
    if (!sessionId) return
    const timer = setTimeout(() => {
      const session: store.Session = {
        id: sessionId,
        text,
        createdAt,
        updatedAt: new Date().toISOString(),
      }
      store.saveSession(session)
      // keep archive in sync when editing the current session
      if (text.trim()) {
        store.archiveSession(session)
        setSessions(store.getSessions())
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [text, sessionId, createdAt])

  const showToast = (msg: string, type: 'success' | 'error', opts?: { actionLabel?: string; onAction?: () => void; duration?: number }) => {
    setToast({ msg, type, ...opts })
  }

  // surface recorder errors
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- toast in response to external state change
    if (recorder.errorKey) showToast(t(lang, recorder.errorKey), 'error')
  }, [recorder.errorKey, lang])

  // surface API errors
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- toast in response to external state change
    if (gemini.error) showToast(gemini.error, 'error')
  }, [gemini.error])

  const handleThemeChange = (pref: store.ThemePref) => {
    setThemePref(pref)
    store.saveThemePref(pref)
    setResolvedTheme(store.getResolvedTheme(pref))
  }

  const handleLangChange = (newLang: store.Lang) => {
    setLang(newLang)
    store.saveLang(newLang)
  }

  const handleApiKeySubmit = (key: string) => {
    store.setApiKey(key)
    setApiKey(key)
  }

  const handleApiKeyDelete = () => {
    store.removeApiKey()
    setApiKey(null)
    setSettingsOpen(false)
  }

  const handleModelChange = (newModel: string) => {
    setModel(newModel)
    store.saveModel(newModel)
  }

  const handleCustomInstructionsSave = (text: string) => {
    setCustomInstructions(text)
    store.saveCustomInstructions(text)
  }

  const handleModesSave = (newModes: store.Mode[]) => {
    setModes(newModes)
    store.saveModes(newModes)
    if (!newModes.find(m => m.id === activeMode)) {
      const fallback = newModes[0]?.id ?? 'general'
      setActiveMode(fallback)
      store.saveActiveMode(fallback)
    }
  }

  const handleActiveModeChange = (modeId: string) => {
    setActiveMode(modeId)
    store.saveActiveMode(modeId)
  }

  const applyAction = useCallback(
    (action: GeminiAction) => {
      switch (action.action) {
        case 'transcribe':
        case 'rewrite':
          setText(action.content ?? '')
          break
        case 'append':
          setText((prev) => {
            const separator = prev.trim() ? (prev.endsWith('\n') ? '' : '\n') : ''
            return prev + separator + (action.content ?? '')
          })
          break
        case 'replace':
          if (action.search && action.replace !== undefined) {
            setText((prev) => prev.replace(action.search!, action.replace!))
          }
          break
      }
    },
    [],
  )

  const handleRecordStart = useCallback(async () => {
    await recorder.startRecording()
  }, [recorder])

  const handleRecordStop = useCallback(async () => {
    const blob = await recorder.stopRecording()
    if (!blob) return

    const currentText = textRef.current
    const currentDict = dictionaryRef.current
    const currentCustomInstr = customInstructionsRef.current
    const currentModes = modesRef.current
    const currentActiveMode = activeModeRef.current
    const activeModeObj = currentModes.find(m => m.id === currentActiveMode)

    setUndoSnapshot(currentText)
    const result = await gemini.processAudio(blob, currentText, {
      dictionary: currentDict,
      customInstructions: currentCustomInstr,
      modeInstructions: activeModeObj?.instructions,
    })
    if (result) applyAction(result)
  }, [recorder, gemini, applyAction])

  const handleUndo = () => {
    if (undoSnapshot === null) return
    setText(undoSnapshot)
    setUndoSnapshot(null)
    showToast(t(lang, 'undone'), 'success')
  }

  const handleCancelRecording = useCallback(() => {
    recorder.cancelRecording()
    spaceDownRef.current = false
    showToast(t(lang, 'recordingCancelled'), 'success')
  }, [recorder, lang])

  // keyboard shortcuts: spacebar hold-to-talk + ESC to cancel
  useEffect(() => {
    if (!apiKey) return

    const isEditable = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      return el.isContentEditable
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && recorder.isRecording) {
        e.preventDefault()
        handleCancelRecording()
        return
      }
      if (e.code !== 'Space' || e.repeat) return
      if (isEditable(e.target)) return
      if (gemini.isProcessing || settingsOpen) return
      e.preventDefault()
      spaceDownRef.current = true
      if (!recorder.isRecording) {
        recorder.startRecording()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (!spaceDownRef.current) return
      e.preventDefault()
      spaceDownRef.current = false
      if (recorder.isRecording) {
        handleRecordStop()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [apiKey, recorder.isRecording, gemini.isProcessing, settingsOpen, handleRecordStop, handleCancelRecording, recorder])

  const handleCopy = async () => {
    if (!text.trim()) return
    try {
      await navigator.clipboard.writeText(text)
      showToast(t(lang, 'copied'), 'success')
    } catch {
      showToast(t(lang, 'copyFailed'), 'error')
    }
  }

  const handleDictionarySave = (dict: string) => {
    store.saveDictionary(dict)
    setDictionary(dict)
  }

  const handleNewSession = () => {
    if (text.trim() && sessionId) {
      store.archiveSession({
        id: sessionId,
        text,
        createdAt,
        updatedAt: new Date().toISOString(),
      })
    }
    const s = store.createNewSession()
    store.saveSession(s)
    setText('')
    setSessionId(s.id)
    setCreatedAt(s.createdAt)
    setUndoSnapshot(null)
    setSessions(store.getSessions())
  }

  const handleSelectSession = (session: store.Session) => {
    // save current session first
    if (text.trim() && sessionId) {
      store.archiveSession({
        id: sessionId,
        text,
        createdAt,
        updatedAt: new Date().toISOString(),
      })
    }
    // load selected session
    setText(session.text)
    setSessionId(session.id)
    setCreatedAt(session.createdAt)
    setUndoSnapshot(null)
    store.saveSession(session)
    setSessions(store.getSessions())
    setSidebarOpen(false)
  }

  const handleDeleteSession = (session: store.Session) => {
    const removed = store.deleteSession(session.id)
    if (!removed) return

    setSessions(store.getSessions())

    // if deleting the active session, create a new one
    if (session.id === sessionId) {
      const s = store.createNewSession()
      store.saveSession(s)
      setText('')
      setSessionId(s.id)
      setCreatedAt(s.createdAt)
      setUndoSnapshot(null)
    }

    showToast(t(lang, 'sessionDeleted'), 'success', {
      actionLabel: t(lang, 'undoAction'),
      duration: 5000,
      onAction: () => {
        store.restoreSession(removed)
        setSessions(store.getSessions())
        setToast(null)
      },
    })
  }

  // ── render onboarding ──
  if (!apiKey) {
    return (
      <div className="app" data-theme={resolvedTheme}>
        <Onboarding lang={lang} onSubmit={handleApiKeySubmit} />
      </div>
    )
  }

  // ── render main ──
  return (
    <div className="app-layout">
      <Sidebar
        lang={lang}
        open={sidebarOpen}
        sessions={sessions}
        activeSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="app">
        <header className="header">
          <div className="header-left">
            <button
              className="icon-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="header-title">VoiceInput</span>
          </div>
          <div className="header-actions">
            <select
              className="mode-select"
              value={activeMode}
              onChange={(e) => handleActiveModeChange(e.target.value)}
            >
              {modes.map(m => (
                <option key={m.id} value={m.id}>{m.name || 'Unnamed'}</option>
              ))}
            </select>
            <button
              className="icon-btn"
              onClick={handleUndo}
              disabled={undoSnapshot === null}
              aria-label={t(lang, 'undo')}
              title={t(lang, 'undo')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button
              className="icon-btn"
              onClick={() => setSettingsOpen(true)}
              aria-label={t(lang, 'openSettings')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        <main className="main">
          <TextEditor lang={lang} value={text} onChange={setText} />

          <div className="action-bar">
            <div className="action-bar-side">
              <button
                className="action-btn"
                onClick={handleNewSession}
                aria-label={t(lang, 'newSession')}
                title={t(lang, 'newSession')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <RecordButton
              lang={lang}
              isRecording={recorder.isRecording}
              isProcessing={gemini.isProcessing}
              duration={recorder.duration}
              analyserNode={recorder.analyserNode}
              onStart={handleRecordStart}
              onStop={handleRecordStop}
            />

            <div className="action-bar-side action-bar-side-end">
              <button
                className="action-btn"
                onClick={handleCopy}
                disabled={!text.trim()}
                aria-label={t(lang, 'copy')}
                title={t(lang, 'copy')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>

          <p className="shortcut-hint">
            {recorder.isRecording ? t(lang, 'escHint') : t(lang, 'spaceHint')}
          </p>
        </main>

        <Settings
          key={settingsOpen ? 'open' : 'closed'}
          lang={lang}
          themePref={themePref}
          apiKey={apiKey}
          dictionary={dictionary}
          customInstructions={customInstructions}
          modes={modes}
          model={model}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={handleApiKeySubmit}
          onDelete={handleApiKeyDelete}
          onDictionarySave={handleDictionarySave}
          onCustomInstructionsSave={handleCustomInstructionsSave}
          onModesSave={handleModesSave}
          onModelChange={handleModelChange}
          onLangChange={handleLangChange}
          onThemeChange={handleThemeChange}
        />

        {toast && (
          <Toast
            message={toast.msg}
            type={toast.type}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            duration={toast.duration}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}
