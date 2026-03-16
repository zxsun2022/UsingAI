import type { Lang } from '../utils/storage'
import { t } from '../utils/i18n'
import './TextEditor.css'

interface Props {
  lang: Lang
  value: string
  onChange: (text: string) => void
}

export function TextEditor({ lang, value, onChange }: Props) {
  return (
    <div className="editor-wrap">
      <textarea
        className="editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(lang, 'editorPlaceholder')}
        spellCheck={false}
      />
    </div>
  )
}
