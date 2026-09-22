import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { completeSession, getSession } from '../api/public'
import { CompleteScreen } from './CompleteScreen'
import { ExperimentRunner } from './ExperimentRunner'
import { IntroScreen } from './IntroScreen'
import { strings } from './i18n'
import type { Language, PublicSessionState } from '../types'

type Phase = 'loading' | 'error' | 'intro' | 'running' | 'done'

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<PublicSessionState | null>(null)

  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId)
      .then((s) => {
        setSession(s)
        setPhase(s.status === 'completed' ? 'done' : 'intro')
      })
      .catch(() => setPhase('error'))
  }, [sessionId])

  if (phase === 'loading' || !sessionId) return null

  const language: Language = session?.language ?? 'ru'
  const t = strings[language]

  if (phase === 'error') {
    return (
      <div className="auth">
        <div className="auth-card">
          <p className="error">{t.loadError}</p>
        </div>
      </div>
    )
  }

  if (phase === 'done') return <CompleteScreen language={language} />

  if (phase === 'intro') {
    return <IntroScreen language={language} onStart={() => setPhase('running')} />
  }

  return (
    <ExperimentRunner
      session={session!}
      onFinished={() => {
        completeSession(sessionId).finally(() => setPhase('done'))
      }}
    />
  )
}
