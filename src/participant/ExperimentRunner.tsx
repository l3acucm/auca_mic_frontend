import { useEffect, useRef, useState } from 'react'
import { postTrial } from '../api/public'
import { strings } from './i18n'
import { createRecognition, isSpeechRecognitionSupported } from './speechRecognition'
import { useMicLevel } from './useMicLevel'
import type { PublicSessionState, TrialEvent } from '../types'

const TIMEOUT_MS = 5000
// Approximate "you're loud enough" mark — not the engine's real threshold
// (browsers don't expose one), just a visual reference point for the meter.
const MIC_LEVEL_TARGET = 0.12

function MicLevelMeter({
  level, status, errorMessage, hint,
}: { level: number; status: 'requesting' | 'active' | 'error'; errorMessage: string; hint: string }) {
  const statusText =
    status === 'requesting' ? 'Запрашиваю доступ к микрофону…'
    : status === 'error' ? `Микрофон недоступен: ${errorMessage}`
    : `${hint} (${Math.round(level * 100)}%)`

  return (
    <div className="mic-meter" role="img" aria-label={hint} title={hint}>
      <div className="mic-meter-track">
        <div className="mic-meter-fill" style={{ width: `${Math.round(level * 100)}%` }} />
        <div className="mic-meter-target" style={{ left: `${MIC_LEVEL_TARGET * 100}%` }} />
      </div>
      <span className={status === 'error' ? 'mic-meter-hint error' : 'mic-meter-hint'}>
        {statusText}
      </span>
    </div>
  )
}

interface Props {
  session: PublicSessionState
  onFinished: () => void
}

/** Runs one stimulus at a time (BRD module 3): shows the image, listens via
 * Web Speech API, and advances the instant an answer/skip/timeout happens —
 * scoring happens server-side, asynchronously, and never blocks the advance
 * (BRD 3.6). */
export function ExperimentRunner({ session, onFinished }: Props) {
  const [index, setIndex] = useState(0)
  const [listening, setListening] = useState(false)
  const mic = useMicLevel()
  const t = strings[session.language]

  const tStimulusRef = useRef<Date>(new Date())
  const tVoiceRef = useRef<Date | null>(null)
  const respondedRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stimulus = session.stimuli[index]

  useEffect(() => {
    if (index >= session.stimuli.length) {
      onFinished()
      return
    }

    tStimulusRef.current = new Date()
    tVoiceRef.current = null
    respondedRef.current = false
    setListening(true)

    const recognition = createRecognition(session.language)
    recognitionRef.current = recognition
    // Temporary diagnostics: SpeechRecognition has been silently hitting the
    // 5s failsafe with no onresult/onerror at all — logging the full
    // lifecycle so the next report shows exactly what (if anything) fires.
    console.log('[speech] starting recognition for', stimulus.filename, 'lang=', session.language)

    recognition.onspeechstart = () => {
      console.log('[speech] onspeechstart')
      tVoiceRef.current = new Date()
    }
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      console.log('[speech] onresult:', transcript)
      if (respondedRef.current) return
      finish('recognized', transcript, tVoiceRef.current ?? new Date())
    }
    recognition.onerror = (event) => {
      console.log('[speech] onerror:', event.error)
      if (respondedRef.current) return
      finish('speech_error', '', new Date())
    }
    recognition.onend = () => {
      console.log('[speech] onend')
    }
    try {
      recognition.start()
    } catch (err) {
      console.log('[speech] start() threw:', err)
    }

    timerRef.current = setTimeout(() => {
      console.log('[speech] hit 5s failsafe timeout')
      if (respondedRef.current) return
      finish('timeout', '', new Date())
    }, TIMEOUT_MS)

    function finish(event: TrialEvent, recognizedText: string, tEnd: Date) {
      respondedRef.current = true
      setListening(false)
      if (timerRef.current) clearTimeout(timerRef.current)
      try {
        recognition.stop()
      } catch {
        /* already stopped */
      }
      const reactionTimeSec = Math.max(0, (tEnd.getTime() - tStimulusRef.current.getTime()) / 1000)
      postTrial(session.id, {
        stimulus_filename: stimulus.filename,
        reaction_time_sec: reactionTimeSec,
        recognized_text: recognizedText,
        event,
        timestamp_stimulus: tStimulusRef.current.toISOString(),
        timestamp_speech_start: event === 'recognized' ? tEnd.toISOString() : null,
      }).catch(() => {
        /* best-effort — the attempt continues even if one trial fails to save */
      })
      setIndex((i) => i + 1)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      try {
        recognition.abort()
      } catch {
        /* already stopped */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function handleDontKnow() {
    if (respondedRef.current) return
    respondedRef.current = true
    setListening(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      recognitionRef.current?.stop()
    } catch {
      /* already stopped */
    }
    const tSkip = new Date()
    const reactionTimeSec = Math.max(0, (tSkip.getTime() - tStimulusRef.current.getTime()) / 1000)
    postTrial(session.id, {
      stimulus_filename: stimulus.filename,
      reaction_time_sec: reactionTimeSec,
      recognized_text: '',
      event: 'skipped',
      timestamp_stimulus: tStimulusRef.current.toISOString(),
      timestamp_speech_start: null,
    }).catch(() => {})
    setIndex((i) => i + 1)
  }

  if (!isSpeechRecognitionSupported()) {
    return (
      <div className="runner-error">
        <p>{t.unsupported}</p>
      </div>
    )
  }

  if (!stimulus) return null

  return (
    <div className="runner">
      <div className="progress">
        {index + 1} / {session.stimuli.length}
      </div>
      <img className="stimulus-image" src={stimulus.url} alt="" />
      <p className="instruction">
        {t.instruction} {listening && <span className="mic-dot" aria-hidden />}
      </p>
      <MicLevelMeter
        level={mic.level} status={mic.status} errorMessage={mic.errorMessage} hint={t.micLevelHint}
      />
      <button type="button" className="btn-secondary" onClick={handleDontKnow}>
        {t.dontKnow}
      </button>
    </div>
  )
}
