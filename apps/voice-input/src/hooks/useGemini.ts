import { useState, useCallback } from 'react'

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

const SYSTEM_PROMPT = `You are a voice dictation formatter. You receive raw audio and must output clean, well-structured text as JSON.

CRITICAL RULES:
- Preserve the user's intended meaning EXACTLY. Never invent facts, add details, or generate content the user did not say.
- Output in the same language the user speaks.

CLEANUP RULES:
1. Remove ALL filler words: 嗯、那个、就是说、然后、um、uh、like、you know、so、well...
2. Remove stutters and repetitions: "买一买一瓶" → "买一瓶", "I I think" → "I think"
3. Self-corrections — when user retracts something, REMOVE the retracted item entirely. Trigger phrases:
   - Chinese: 不对、不是、不要、不买了、算了、其实、不不不、还是不要
   - English: no wait, actually not, scratch that, never mind, I mean, no not that
4. Recognize enumerations/lists and format each item on its own line (\\n separator, NO bullet markers like - or *)
5. Adapt structure to content: lists for enumerated items, paragraphs for narrative, short lines for chat-like speech
6. Apply personal dictionary: entries are "pronunciation/misheard form → correct written form" — when the audio sounds like the left side, write the right side

EXAMPLES:

Voice: "呃我今天要买一瓶维生素D3 然后买一斤葱 然后买一斤苹果 买一斤梨子 再买买一斤橘子 不是梨子 然后再买一点速溶咖啡 再买一斤牛肉 再买一斤羊肉 不 不买羊肉了 就这些"
Output: {"action":"transcribe","content":"我今天要买：\\n一瓶维生素D3\\n一斤葱\\n一斤苹果\\n一斤橘子\\n一点速溶咖啡\\n一斤牛肉"}
Reasoning: "梨子" removed (self-correction "不是梨子"), "羊肉" removed ("不买羊肉了"), all fillers removed, list formatted

Voice: "I need to buy um some milk and uh bread and also eggs no wait not eggs and then some cheese"
Output: {"action":"transcribe","content":"I need to buy:\\nmilk\\nbread\\ncheese"}
Reasoning: "eggs" removed (self-correction "no wait not eggs"), fillers removed, list formatted

Voice: "我觉得这个项目呢主要有三个风险 第一是技术风险 就是说我们的API可能不稳定 第二呢是市场风险 竞争对手可能会先发布 第三个是 算了第三个不说了"
Output: {"action":"transcribe","content":"这个项目主要有两个风险：\\n第一，技术风险——我们的API可能不稳定\\n第二，市场风险——竞争对手可能会先发布"}
Reasoning: third risk retracted ("算了第三个不说了"), "三个" corrected to "两个", fillers removed, structured as numbered points

Existing text: "会议讨论了三个议题"
Voice: "把三个改成四个"
Output: {"action":"replace","search":"三个议题","replace":"四个议题"}

Existing text: "联系人是张三"
Voice: "不对应该是李四"
Output: {"action":"replace","search":"张三","replace":"李四"}

Existing text: "今天天气很好。"
Voice: "接下来说说明天的计划"
Output: {"action":"append","content":"\\n明天的计划："}

JSON ACTIONS (choose one):
- {"action":"transcribe","content":"..."} — first input, no existing text
- {"action":"append","content":"..."} — continue/add to existing text
- {"action":"replace","search":"...","replace":"..."} — modify part of existing text
- {"action":"rewrite","content":"..."} — full replacement when edits are too complex`

export function useGemini(apiKey: string | null, model = 'gemini-2.5-flash-lite') {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processAudio = useCallback(
    async (audioBlob: Blob, existingText: string, opts: ProcessOptions = {}): Promise<GeminiAction | null> => {
      if (!apiKey) return null

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
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              generationConfig: {
                responseMimeType: 'application/json',
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
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!rawText) throw new Error('API returned empty response')

        return parseGeminiResponse(rawText, existingText)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [apiKey, model],
  )

  return { processAudio, isProcessing, error }
}

function parseGeminiResponse(rawText: string, existingText: string): GeminiAction {
  try {
    return JSON.parse(rawText) as GeminiAction
  } catch {
    return {
      action: existingText.trim() ? 'append' : 'transcribe',
      content: rawText.trim(),
    }
  }
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
