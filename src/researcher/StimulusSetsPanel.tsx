import { useEffect, useState, type FormEvent } from 'react'
import { listStimulusSets, uploadStimulusSet } from '../api/experiments'
import { extractErrorCode } from '../api/client'
import type { StimulusSet } from '../types'

export function StimulusSetsPanel({ onChanged }: { onChanged?: () => void }) {
  const [sets, setSets] = useState<StimulusSet[]>([])
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function refresh() {
    listStimulusSets().then(setSets).catch(() => {})
  }

  useEffect(refresh, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setError('')
    setBusy(true)
    try {
      await uploadStimulusSet(file, name.trim())
      setName('')
      setFile(null)
      refresh()
      onChanged?.()
    } catch (err) {
      setError(`Ошибка загрузки: ${extractErrorCode(err)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2>Наборы стимулов</h2>
      <form onSubmit={handleSubmit} className="inline-form">
        <input
          type="text"
          placeholder="Название (опционально)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="file"
          accept=".zip"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
        <button type="submit" className="btn-primary" disabled={busy || !file}>
          {busy ? 'Загружаем…' : 'Загрузить ZIP'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Стимулов</th>
            <th>Создан</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((s) => (
            <tr key={s.id}>
              <td>{s.name || '—'}</td>
              <td>{s.stimulus_count}</td>
              <td>{new Date(s.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
