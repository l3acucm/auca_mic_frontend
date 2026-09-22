import { useEffect, useState, type FormEvent } from 'react'
import { addStimulus, createStimulusSet, getStimulusSet, listStimulusSets } from '../api/experiments'
import { extractErrorCode } from '../api/client'
import type { StimulusSet, StimulusSetDetail } from '../types'

export function StimulusSetsPanel({ onChanged }: { onChanged?: () => void }) {
  const [sets, setSets] = useState<StimulusSet[]>([])
  const [active, setActive] = useState<StimulusSetDetail | null>(null)
  const [newSetName, setNewSetName] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [answers, setAnswers] = useState('')
  const [imageInputKey, setImageInputKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function refreshList() {
    listStimulusSets().then(setSets).catch(() => {})
  }

  useEffect(refreshList, [])

  async function handleCreateSet(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const created = await createStimulusSet(newSetName.trim())
      setActive(created)
      setNewSetName('')
      refreshList()
    } catch (err) {
      setError(`Ошибка: ${extractErrorCode(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddStimulus(e: FormEvent) {
    e.preventDefault()
    if (!active || !image || !answers.trim()) return
    setError('')
    setBusy(true)
    try {
      const updated = await addStimulus(active.id, image, answers.trim())
      setActive(updated)
      setAnswers('')
      setImage(null)
      setImageInputKey((k) => k + 1)
      refreshList()
      onChanged?.()
    } catch (err) {
      setError(`Ошибка: ${extractErrorCode(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function openSet(id: string) {
    setActive(await getStimulusSet(id))
  }

  return (
    <section>
      <h2>Наборы стимулов</h2>

      {!active && (
        <form onSubmit={handleCreateSet} className="inline-form">
          <input
            type="text" placeholder="Название нового набора" value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)} required
          />
          <button type="submit" className="btn-primary" disabled={busy || !newSetName.trim()}>
            Создать набор
          </button>
        </form>
      )}

      {active && (
        <div className="stack-form">
          <p>
            Набор «{active.name || active.id}» — {active.stimuli.length} стимулов.{' '}
            <button type="button" className="btn-link" onClick={() => setActive(null)}>
              Закрыть
            </button>
          </p>

          <form onSubmit={handleAddStimulus} className="inline-form">
            <input
              key={imageInputKey} type="file" accept="image/jpeg"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)} required
            />
            <input
              type="text" placeholder="Ответы через ; или , (жук; букашка)"
              value={answers} onChange={(e) => setAnswers(e.target.value)} required
            />
            <button type="submit" className="btn-secondary" disabled={busy || !image || !answers.trim()}>
              Добавить стимул
            </button>
          </form>

          {active.stimuli.length > 0 && (
            <table className="data-table">
              <thead>
                <tr><th>Картинка</th><th>Файл</th><th>Ответы</th></tr>
              </thead>
              <tbody>
                {active.stimuli.map((s) => (
                  <tr key={s.filename}>
                    <td><img src={s.url} alt="" style={{ height: 40 }} /></td>
                    <td>{s.filename}</td>
                    <td>{s.answers.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <h2>Существующие наборы</h2>
      <table className="data-table">
        <thead>
          <tr><th>Название</th><th>Стимулов</th><th>Создан</th><th></th></tr>
        </thead>
        <tbody>
          {sets.map((s) => (
            <tr key={s.id}>
              <td>{s.name || '—'}</td>
              <td>{s.stimulus_count}</td>
              <td>{new Date(s.created_at).toLocaleString()}</td>
              <td>
                <button type="button" className="btn-link" onClick={() => openSet(s.id)}>
                  Открыть / дополнить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
