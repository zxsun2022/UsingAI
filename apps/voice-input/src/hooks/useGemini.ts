import { useState, useCallback, useRef } from 'react'

export interface GeminiAction {
  action: 'append' | 'replace' | 'rewrite' | 'transcribe'
  content?: string
  search?: string
  replace?: string
}

export interface ProcessOptions {
  dictionary?: string
  customInstructions?: string
  modeInstructions?: string
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    action: {
      type: 'STRING',
      enum: ['append', 'replace', 'rewrite', 'transcribe'],
    },
    content: { type: 'STRING' },
    search: { type: 'STRING' },
    replace: { type: 'STRING' },
  },
  required: ['action'],
} as const

const SYSTEM_PROMPT = `You are a voice dictation formatter.

Return exactly one JSON object. No markdown, no code fences, no explanation.

Priority order:
1. Preserve the user's intended meaning exactly.
2. Apply explicit corrections the user makes while speaking.
3. Clean up disfluencies and structure the text.
4. Apply mode/style instructions only if they do not conflict with 1-3.

Core rules:
- Keep the output in the language implied by the speech and existing text unless custom instructions explicitly require otherwise.
- Never invent facts, names, numbers, or details the user did not say.
- Remove filler words and disfluencies such as 嗯、那个、就是说、然后、um、uh、like、you know、so、well.
- Remove stutters and immediate repetitions.
- Respect self-corrections and retractions. Remove the retracted content entirely.
- Apply the personal dictionary when the spoken form matches an entry.
- By default, format enumerations as one item per line using "\\n". Do not add bullet markers unless the active mode or custom instructions explicitly require bullets.

Choose exactly one action:
- {"action":"transcribe","content":"..."} when there is no meaningful existing text.
- {"action":"append","content":"..."} when the audio adds new text after the existing text. Return only the new text, not the full draft.
- {"action":"replace","search":"...","replace":"...","content":"..."} when a specific part of the existing text should change.
- {"action":"rewrite","content":"..."} when the update affects multiple parts, the target span is ambiguous, or a clean replace is unsafe.

Rules for "replace":
- "search" must be an exact substring from the existing text.
- "replace" is the exact new text for that substring.
- Also include "content" as the full updated text after the replacement.
- If you cannot identify a single exact substring confidently, do not guess. Use "rewrite" instead.

Examples:
Voice: "呃我今天要买一瓶维生素D3 然后买一斤葱 然后买一斤苹果 买一斤梨子 再买买一斤橘子 不是梨子 然后再买一点速溶咖啡 再买一斤牛肉 不买羊肉了 就这些"
Output: {"action":"transcribe","content":"我今天要买：\\n一瓶维生素D3\\n一斤葱\\n一斤苹果\\n一斤橘子\\n一点速溶咖啡\\n一斤牛肉"}

Existing text: "联系人是张三"
Voice: "不对应该是李四"
Output: {"action":"replace","search":"张三","replace":"李四","content":"联系人是李四"}

Existing text: "今天天气很好。"
Voice: "接下来说说明天的计划"
Output: {"action":"append","content":"明天的计划："}`

export function useGemini(apiKey: string | null, model = 'gemini-2.5-flash-lite') {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const processAudio = useCallback(
    async (audioBlob: Blob, existingText: string, opts: ProcessOptions = {}): Promise<GeminiAction | null> => {
      if (!apiKey) return null

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      abortRef.current?.abort()

      const controller = new AbortController()
      abortRef.current = controller

      setIsProcessing(true)
      setError(null)

      try {
        const base64 = await blobToBase64(audioBlob)
        const mimeType = audioBlob.type.split(';')[0] || 'audio/webm'

        let systemPrompt = SYSTEM_PROMPT
        if (opts.customInstructions?.trim()) {
          systemPrompt += `\n\n[User's custom instructions — always follow these]\n${opts.customInstructions}`
        }
        if (opts.modeInstructions?.trim()) {
          systemPrompt += `\n\n[Active mode — adapt output style accordingly]\n${opts.modeInstructions}`
        }

        const userParts: string[] = []
        if (existingText.trim()) {
          userParts.push(`[Existing text]\n${existingText}`)
        }
        if (opts.dictionary?.trim()) {
          userParts.push(`[Dictionary — spoken/misheard form → correct written form]\n${opts.dictionary}`)
        }
        userParts.push('[Voice input follows — process according to rules]')
        const userPrompt = userParts.join('\n\n')

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: RESPONSE_SCHEMA,
                temperature: 0.2,
              },
              contents: [
                {
                  parts: [
                    { text: userPrompt },
                    { inline_data: { mime_type: mimeType, data: base64 } },
                  ],
                },
              ],
            }),
          },
        )

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody?.error?.message || `API error (${res.status})`)
        }

        const data = await res.json()
        const rawText = extractResponseText(data)

        if (!rawText) throw new Error('API returned empty response')

        return parseGeminiResponse(rawText, existingText)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return null
        }
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
        return null
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
        if (requestIdRef.current === requestId) {
          setIsProcessing(false)
        }
      }
    },
    [apiKey, model],
  )

  const cancelProcessing = useCallback((): boolean => {
    if (!abortRef.current) return false
    requestIdRef.current += 1
    abortRef.current.abort()
    abortRef.current = null
    setIsProcessing(false)
    setError(null)
    return true
  }, [])

  return { processAudio, cancelProcessing, isProcessing, error }
}

function parseGeminiResponse(rawText: string, existingText: string): GeminiAction {
  const normalized = normalizeRawText(rawText)
  let parsed: unknown

  try {
    parsed = JSON.parse(normalized)
  } catch {
    if (!normalized) {
      throw new Error('Model returned an empty response.')
    }
    return {
      action: existingText.trim() ? 'append' : 'transcribe',
      content: normalized,
    }
  }

  return validateGeminiAction(parsed)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function extractResponseText(payload: unknown): string {
  if (!isRecord(payload)) return ''
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : []

  return candidates
    .flatMap((candidate) => {
      if (!isRecord(candidate) || !isRecord(candidate.content)) return []
      return Array.isArray(candidate.content.parts) ? candidate.content.parts : []
    })
    .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

function validateGeminiAction(value: unknown): GeminiAction {
  if (!isRecord(value) || typeof value.action !== 'string') {
    throw new Error('Model returned invalid JSON.')
  }

  const content = readOptionalString(value.content)

  switch (value.action) {
    case 'append':
    case 'rewrite':
    case 'transcribe':
      if (content === undefined) {
        throw new Error(`Model returned an invalid "${value.action}" action.`)
      }
      return { action: value.action, content }
    case 'replace': {
      const search = readOptionalString(value.search, { trim: true })
      const replace = typeof value.replace === 'string' ? value.replace : undefined
      if ((search === undefined || replace === undefined) && content === undefined) {
        throw new Error('Model returned an invalid replace action.')
      }
      return {
        action: 'replace',
        content,
        search,
        replace,
      }
    }
    default:
      throw new Error(`Unsupported action "${value.action}".`)
  }
}

function normalizeRawText(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function readOptionalString(value: unknown, opts: { trim?: boolean } = {}): string | undefined {
  if (typeof value !== 'string') return undefined
  return opts.trim ? value.trim() || undefined : value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
