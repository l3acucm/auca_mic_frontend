// Approximate "you're loud enough" mark — not the engine's real threshold
// (browsers don't expose one), just a visual reference point for the meter.
export const MIC_LEVEL_TARGET = 0.12

interface Props {
  level: number
  status: 'requesting' | 'active' | 'error'
  errorMessage: string
  hint: string
}

export function MicLevelMeter({ level, status, errorMessage, hint }: Props) {
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
