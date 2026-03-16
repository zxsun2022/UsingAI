import { useState, useRef, useCallback } from 'react'

export interface RecorderState {
  isRecording: boolean
  duration: number
  analyserNode: AnalyserNode | null
  errorKey: 'micDenied' | 'micUnavailable' | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  cancelRecording: () => void
}

export function useRecorder(): RecorderState {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [errorKey, setErrorKey] = useState<'micDenied' | 'micUnavailable' | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number>(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const resolveStopRef = useRef<((blob: Blob | null) => void) | null>(null)
  const cancelledRef = useRef(false)

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    ctxRef.current?.close()
    ctxRef.current = null
    setAnalyserNode(null)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setIsRecording(false)
    setDuration(0)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setErrorKey(null)
      chunksRef.current = []
      cancelledRef.current = false

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.7
      source.connect(analyser)
      ctxRef.current = audioCtx
      setAnalyserNode(analyser)

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        audioBitsPerSecond: 24_000,
      })
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        if (cancelledRef.current) {
          resolveStopRef.current?.(null)
        } else {
          const blob = new Blob(chunksRef.current, { type: mime })
          resolveStopRef.current?.(blob)
        }
        resolveStopRef.current = null
      }

      recorder.start(100)
      setIsRecording(true)
      setDuration(0)

      const t0 = Date.now()
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - t0) / 1000))
      }, 1000)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setErrorKey('micDenied')
      } else {
        setErrorKey('micUnavailable')
      }
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      cleanup()

      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        resolveStopRef.current = resolve
        recorderRef.current.stop()
      } else {
        resolve(null)
      }
    })
  }, [cleanup])

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true
    cleanup()

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [cleanup])

  return { isRecording, duration, analyserNode, errorKey, startRecording, stopRecording, cancelRecording }
}
