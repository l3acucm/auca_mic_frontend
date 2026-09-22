import { strings } from './i18n'
import type { Language } from '../types'

export function CompleteScreen({ language }: { language: Language }) {
  const t = strings[language]
  return (
    <div className="auth">
      <div className="auth-card">
        <h1 className="auth-title">{t.finishTitle}</h1>
        <p className="auth-sub">{t.finishBody}</p>
      </div>
    </div>
  )
}
