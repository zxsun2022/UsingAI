const KEYS = {
  API_KEY: 'voiceinput_api_key',
  SESSION: 'voiceinput_current_session',
  SESSIONS: 'voiceinput_sessions',
  THEME: 'voiceinput_theme',
  DICTIONARY: 'voiceinput_dictionary',
  LANG: 'voiceinput_lang',
  MODEL: 'voiceinput_model',
  CUSTOM_INSTRUCTIONS: 'voiceinput_custom_instructions',
  MODES: 'voiceinput_modes',
  ACTIVE_MODE: 'voiceinput_active_mode',
} as const

export type Lang = 'en' | 'zh'
export type ThemePref = 'auto' | 'dark' | 'light'

export interface Session {
  id: string
  text: string
  createdAt: string
  updatedAt: string
}

export interface Mode {
  id: string
  name: string
  instructions: string
  builtin?: boolean
}

export const DEFAULT_MODEL = 'gemini-2.5-flash-lite'

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash-lite', label: '2.5 Flash-Lite (fastest)' },
  { id: 'gemini-2.5-flash', label: '2.5 Flash (balanced)' },
  { id: 'gemini-2.5-pro', label: '2.5 Pro (most capable)' },
  { id: 'gemini-3.1-flash-lite-preview', label: '3.1 Flash-Lite (preview)' },
  { id: 'gemini-3-flash-preview', label: '3 Flash (preview)' },
] as const

export const DEFAULT_MODES: Mode[] = [
  { id: 'general', name: 'General', instructions: '', builtin: true },
  { id: 'messaging', name: 'Messaging', instructions: 'Keep tone casual and friendly; use contractions freely. Short, conversational sentences.', builtin: true },
  { id: 'coding', name: 'Coding', instructions: 'Preserve variable, function, and type names exactly as spoken (camelCase, snake_case, PascalCase). Wrap code identifiers and snippets in backticks.', builtin: true },
  { id: 'email', name: 'Email', instructions: 'Maintain courteous, semi-formal tone. Use appropriate greetings and sign-offs.', builtin: true },
  { id: 'notes', name: 'Notes', instructions: 'Use bullet points, keep concise, highlight key information. Structure as organized notes.', builtin: true },
]

function parseJson(key: string): unknown {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeSession(value: unknown): Session | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.text !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  return {
    id: value.id,
    text: value.text,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function normalizeMode(value: unknown): Mode | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.instructions !== 'string') {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    instructions: value.instructions,
    builtin: value.builtin === true,
  }
}

function dedupeAndSortSessions(sessions: Session[]): Session[] {
  const byId = new Map<string, Session>()

  for (const session of sessions) {
    byId.set(session.id, session)
  }

  return [...byId.values()]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 50)
}

// ── API Key ──

export function getApiKey(): string | null {
  return localStorage.getItem(KEYS.API_KEY)
}

export function setApiKey(key: string) {
  localStorage.setItem(KEYS.API_KEY, key)
}

export function removeApiKey() {
  localStorage.removeItem(KEYS.API_KEY)
}

// ── Theme ──

export function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getThemePref(): ThemePref {
  const stored = localStorage.getItem(KEYS.THEME)
  if (stored === 'dark' || stored === 'light' || stored === 'auto') return stored
  return 'auto'
}

export function getResolvedTheme(pref?: ThemePref): 'dark' | 'light' {
  const p = pref ?? getThemePref()
  return p === 'auto' ? getSystemTheme() : p
}

export function saveThemePref(pref: ThemePref) {
  localStorage.setItem(KEYS.THEME, pref)
}

// ── Session (current) ──

export function getCurrentSession(): Session | null {
  return normalizeSession(parseJson(KEYS.SESSION))
}

export function saveSession(session: Session) {
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session))
}

export function createNewSession(): Session {
  return {
    id: crypto.randomUUID(),
    text: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ── Session archive ──

export function getSessions(): Session[] {
  const parsed = parseJson(KEYS.SESSIONS)
  if (!Array.isArray(parsed)) return []
  return dedupeAndSortSessions(parsed.map(normalizeSession).filter((session): session is Session => session !== null))
}

export function archiveSession(session: Session) {
  if (!session.text.trim()) return
  const sessions = dedupeAndSortSessions([session, ...getSessions()])
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions))
}

export function deleteSession(id: string): Session | null {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.id === id)
  if (idx < 0) return null
  const [removed] = sessions.splice(idx, 1)
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions))
  return removed
}

export function restoreSession(session: Session) {
  const sessions = dedupeAndSortSessions([session, ...getSessions()])
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions))
}

// ── Dictionary ──

export function getDictionary(): string {
  return localStorage.getItem(KEYS.DICTIONARY) ?? ''
}

export function saveDictionary(dict: string) {
  localStorage.setItem(KEYS.DICTIONARY, dict)
}

// ── Language ──

export function getLang(): Lang {
  const stored = localStorage.getItem(KEYS.LANG)
  return stored === 'en' || stored === 'zh' ? stored : 'en'
}

export function saveLang(lang: Lang) {
  localStorage.setItem(KEYS.LANG, lang)
}

// ── Model ──

export function getModel(): string {
  const stored = localStorage.getItem(KEYS.MODEL)
  return typeof stored === 'string' && stored.trim() ? stored : DEFAULT_MODEL
}

export function saveModel(model: string) {
  localStorage.setItem(KEYS.MODEL, model)
}

// ── Custom Instructions ──

export function getCustomInstructions(): string {
  return localStorage.getItem(KEYS.CUSTOM_INSTRUCTIONS) ?? ''
}

export function saveCustomInstructions(text: string) {
  localStorage.setItem(KEYS.CUSTOM_INSTRUCTIONS, text)
}

// ── Modes ──

export function getModes(): Mode[] {
  const parsed = parseJson(KEYS.MODES)
  if (!Array.isArray(parsed)) return DEFAULT_MODES

  const modes = parsed.map(normalizeMode).filter((mode): mode is Mode => mode !== null)
  return modes.length > 0 ? modes : DEFAULT_MODES
}

export function saveModes(modes: Mode[]) {
  localStorage.setItem(KEYS.MODES, JSON.stringify(modes))
}

export function getActiveMode(): string {
  const stored = localStorage.getItem(KEYS.ACTIVE_MODE)
  return typeof stored === 'string' && stored.trim() ? stored : 'general'
}

export function saveActiveMode(id: string) {
  localStorage.setItem(KEYS.ACTIVE_MODE, id)
}
