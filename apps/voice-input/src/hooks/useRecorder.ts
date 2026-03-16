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

  const resetVisualState = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = 0
    setAnalyserNode(null)
    setIsRecording(false)
    setDuration(0)
  }, [])

  const releaseMediaResources = useCallback(async () => {
    const audioContext = ctxRef.current
    ctxRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    if (audioContext) {
      try {
        await audioContext.close()
      } catch {
        // ignore cleanup failures from already-closed contexts
      }
    }
  }, [])

  const finalizeStop = useCallback(
    async (blob: Blob | null) => {
      chunksRef.current = []
      recorderRef.current = null
      await releaseMediaResources()
      resolveStopRef.current?.(blob)
      resolveStopRef.current = null
      cancelledRef.current = false
    },
    [releaseMediaResources],
  )

  const startRecording = useCallback(async () => {
    if (recorderRef.current?.state === 'recording' || isRecording) return

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
        const blob = cancelledRef.current ? null : new Blob(chunksRef.current, { type: mime })
        void finalizeStop(blob)
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
      resetVisualState()
      void releaseMediaResources()
    }
  }, [finalizeStop, isRecording, releaseMediaResources, resetVisualState])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        resolveStopRef.current = resolve
        resetVisualState()
        recorderRef.current.stop()
      } else {
        resetVisualState()
        void releaseMediaResources()
        resolve(null)
      }
    })
  }, [releaseMediaResources, resetVisualState])

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      resetVisualState()
      recorderRef.current.stop()
    } else {
      resetVisualState()
      void releaseMediaResources()
    }
  }, [releaseMediaResources, resetVisualState])

  return { isRecording, duration, analyserNode, errorKey, startRecording, stopRecording, cancelRecording }
}
