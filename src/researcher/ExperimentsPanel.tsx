import { useEffect, useState, type FormEvent } from 'react'
import {
  archiveExperiment, createExperiment, listExperiments, listStimulusSets, startSession,
  unarchiveExperiment,
} from '../api/experiments'
import { extractErrorCode } from '../api/client'
import type { Experiment, Language, Session, StimulusSet } from '../types'

export function ExperimentsPanel({ refreshKey }: { refreshKey: number }) {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [stimulusSets, setStimulusSets] = useState<StimulusSet[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState<Language>('ru')
  const [numTrials, setNumTrials] = useState(10)
  const [stimulusSetId, setStimulusSetId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessions, setSessions] = useState<Record<string, Session>>({})
  const [participantInputs, setParticipantInputs] = useState<Record<string, string>>({})

  function refresh() {
    listExperiments().then(setExperiments).catch(() => {})
    listStimulusSets().then((sets) => {
      setStimulusSets(sets)
      setStimulusSetId((current) => current || sets[0]?.id || '')
    })
  }

  useEffect(refresh, [refreshKey])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!stimulusSetId) return
    setError('')
    setBusy(true)
    try {
      await createExperiment({
        name: name.trim(), description: description.trim(), language,
        num_trials: numTrials, stimulus_set: stimulusSetId,
      })
      setName('')
      setDescription('')
      refresh()
    } catch (err) {
      setError(`Ошибка: ${extractErrorCode(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleArchive(id: string) {
    if (!window.confirm('Архивировать этот эксперимент?')) return
    await archiveExperiment(id)
    refresh()
  }

  async function handleUnarchive(id: string) {
    await unarchiveExperiment(id)
    refresh()
  }

  async function handleStartSession(experimentId: string) {
    const session = await startSession(experimentId, participantInputs[experimentId])
    setSessions((s) => ({ ...s, [experimentId]: session }))
  }

  return (
    <section>
      <h2>Эксперименты</h2>
      <form onSubmit={handleCreate} className="stack-form">
        <input
          type="text" placeholder="Название эксперимента" value={name}
          onChange={(e) => setName(e.target.value)} required
        />
        <textarea
          placeholder="Описание (опционально)" value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="inline-form">
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
          <input
            type="number" min={1} value={numTrials}
            onChange={(e) => setNumTrials(Number(e.target.value))} required
          />
          <select value={stimulusSetId} onChange={(e) => setStimulusSetId(e.target.value)} required>
            <option value="" disabled>Набор стимулов</option>
            {stimulusSets.map((s) => (
              <option key={s.id} value={s.id}>{s.name || s.id} ({s.stimulus_count})</option>
            ))}
          </select>
          <button type="submit" className="btn-primary" disabled={busy || !stimulusSetId}>
            {busy ? 'Создаём…' : 'Создать'}
          </button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Название</th><th>Язык</th><th>Попыток</th><th>Статус</th><th>Сеанс</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <tr key={exp.id}>
              <td>{exp.name}</td>
              <td>{exp.language.toUpperCase()}</td>
              <td>{exp.num_trials}</td>
              <td>
                {exp.status === 'active' ? (
                  <>
                    активен{' '}
                    <button type="button" className="btn-link" onClick={() => handleArchive(exp.id)}>
                      архивировать
                    </button>
                  </>
                ) : (
                  <>
                    архивирован{' '}
                    <button type="button" className="btn-link" onClick={() => handleUnarchive(exp.id)}>
                      вернуть
                    </button>
                  </>
                )}
              </td>
              <td>
                {sessions[exp.id] ? (
                  <a
                    href={sessions[exp.id].session_url} target="_blank" rel="noreferrer"
                    className="session-url"
                  >
                    {sessions[exp.id].session_url}
                  </a>
                ) : (
                  <div className="inline-form">
                    <input
                      type="text" placeholder="ID участника (авто)"
                      value={participantInputs[exp.id] ?? ''}
                      onChange={(e) =>
                        setParticipantInputs((p) => ({ ...p, [exp.id]: e.target.value }))
                      }
                    />
                    <button type="button" className="btn-secondary" onClick={() => handleStartSession(exp.id)}>
                      Запустить
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
