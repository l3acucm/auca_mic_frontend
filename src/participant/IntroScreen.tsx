import { strings } from './i18n'
import type { Language } from '../types'

interface Props {
  language: Language
  onStart: () => void
}

export function IntroScreen({ language, onStart }: Props) {
  const t = strings[language]
  return (
    <div className="auth">
      <div className="auth-card">
        <h1 className="auth-title">{t.introTitle}</h1>
        <p className="auth-sub">{t.introBody}</p>
        <button type="button" className="btn-primary" onClick={onStart}>
          {t.start}
        </button>
      </div>
    </div>
  )
}
