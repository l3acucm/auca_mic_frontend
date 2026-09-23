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

/** Runs one stimulus at a time (BRD module 3): shows the image and measures
 * reaction time as stimulus-shown -> onspeechstart. `onspeechstart` is local
 * voice-activity detection (no network round trip), unlike the transcript
 * from `onresult` — which needs Chrome's cloud recognition backend and, in
 * practice, silently produced no result at all (blocked/unreachable network
 * path). We stopped waiting on it: no transcript is captured, and "did the
 * participant respond" is the only signal recorded (see BRD changelog). */
export function ExperimentRunner({ session, onFinished }: Props) {
  const [index, setIndex] = useState(0)
  const [listening, setListening] = useState(false)
  const mic = useMicLevel()
  const t = strings[session.language]

  const tStimulusRef = useRef<Date>(new Date())
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
    respondedRef.current = false
    setListening(true)

    const recognition = createRecognition(session.language)
    recognitionRef.current = recognition

    recognition.onspeechstart = () => {
      finish('recognized', new Date())
    }
    recognition.onerror = () => {
      finish('speech_error', new Date())
    }
    recognition.onend = () => {
      // Recognition can end on its own (silence) without onspeechstart or
      // onerror ever firing — treat that the same as a recognition failure
      // instead of waiting out the rest of the 5s failsafe.
      finish('speech_error', new Date())
    }
    try {
      recognition.start()
    } catch {
      finish('speech_error', new Date())
    }

    timerRef.current = setTimeout(() => finish('timeout', new Date()), TIMEOUT_MS)

    function finish(event: TrialEvent, tEnd: Date) {
      if (respondedRef.current) return
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
