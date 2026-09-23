import { strings } from './i18n'
import { MicLevelMeter } from './MicLevelMeter'
import { useMicLevel } from './useMicLevel'
import type { Language } from '../types'

interface Props {
  language: Language
  onStart: () => void
}

export function IntroScreen({ language, onStart }: Props) {
  const t = strings[language]
  // Mic check happens here, before the timed run — during the actual
  // experiment only Web Speech API touches the microphone, with nothing
  // else competing for it (see BRD changelog 2026-09-23).
  const mic = useMicLevel()

  return (
    <div className="auth">
      <div className="auth-card">
        <h1 className="auth-title">{t.introTitle}</h1>
        <p className="auth-sub">{t.introBody}</p>
        <MicLevelMeter
          level={mic.level} status={mic.status} errorMessage={mic.errorMessage} hint={t.micLevelHint}
        />
        <button type="button" className="btn-primary" onClick={onStart}>
          {t.start}
        </button>
      </div>
    </div>
  )
}
