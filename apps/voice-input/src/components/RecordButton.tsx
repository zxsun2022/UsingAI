import { useRef, useEffect } from 'react'
import type { Lang } from '../utils/storage'
import { t } from '../utils/i18n'
import './RecordButton.css'

interface Props {
  lang: Lang
  isRecording: boolean
  isProcessing: boolean
  duration: number
  analyserNode: AnalyserNode | null
  onStart: () => void
  onStop: () => void
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function RecordButton({
  lang,
  isRecording,
  isProcessing,
  duration,
  analyserNode,
  onStart,
  onStop,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!isRecording || !analyserNode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const bufLen = analyserNode.frequencyBinCount
    const freqData = new Uint8Array(bufLen)

    const bars = 36
    const barW = 3
    const gap = 2
    const totalW = bars * (barW + gap) - gap
    const h = 32

    canvas.width = totalW
    canvas.height = h

    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim()

    const draw = () => {
      analyserNode.getByteFrequencyData(freqData)
      ctx.clearRect(0, 0, totalW, h)

      const step = Math.floor(bufLen / bars)
      for (let i = 0; i < bars; i++) {
        const val = freqData[i * step] / 255
        const barH = Math.max(2, val * 26)
        const x = i * (barW + gap)
        const y = (h - barH) / 2

        ctx.fillStyle = accent
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, 1.5)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [isRecording, analyserNode])

  const handleClick = () => {
    if (isProcessing) return
    if (isRecording) {
      onStop()
    } else {
      onStart()
    }
  }

  const stateClass = isRecording ? 'recording' : isProcessing ? 'processing' : ''

  return (
    <div className="record-area">
      <div className={`record-wave-row ${isRecording ? 'visible' : ''}`}>
        <canvas ref={canvasRef} />
        <span className="record-timer">{fmt(duration)}</span>
      </div>

      <button
        className={`record-btn ${stateClass}`}
        onClick={handleClick}
        disabled={isProcessing}
        aria-label={isRecording ? t(lang, 'stopRecording') : t(lang, 'startRecording')}
      >
        {isProcessing ? (
          <div className="record-spinner" />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
        {isRecording && <span className="record-ring" />}
        {isRecording && <span className="record-ring delay" />}
      </button>
    </div>
  )
}
