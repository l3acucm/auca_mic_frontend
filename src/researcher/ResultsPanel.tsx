import { Fragment, useEffect, useState } from 'react'
import { downloadExperimentExport, getResult, listResults, saveBlob } from '../api/results'
import { listExperiments } from '../api/experiments'
import { formatApiDate } from '../utils/date'
import type { Experiment, ResultDetail, ResultRow } from '../types'

export function ResultsPanel() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [experimentId, setExperimentId] = useState('')
  const [participantId, setParticipantId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [results, setResults] = useState<ResultRow[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [detail, setDetail] = useState<ResultDetail | null>(null)

  useEffect(() => {
    listExperiments().then(setExperiments).catch(() => {})
  }, [])

  function refresh() {
    listResults({
      experiment: experimentId || undefined,
      participant_id: participantId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }).then(setResults)
  }

  useEffect(refresh, [experimentId, participantId, dateFrom, dateTo])

  async function toggleDetail(id: string) {
    if (expanded === id) {
      setExpanded(null)
      setDetail(null)
      return
    }
    setExpanded(id)
    setDetail(await getResult(id))
  }

  async function handleExportAll() {
    if (!experimentId) return
    const blob = await downloadExperimentExport(experimentId)
    saveBlob(blob, `experiment_${experimentId}.xlsx`)
  }

  return (
    <section>
      <h2>Результаты</h2>
      <div className="inline-form">
        <select value={experimentId} onChange={(e) => setExperimentId(e.target.value)}>
          <option value="">Все эксперименты</option>
          {experiments.map((exp) => (
            <option key={exp.id} value={exp.id}>{exp.name}</option>
          ))}
        </select>
        <input
          type="text" placeholder="ID участника" value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
        />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button type="button" className="btn-secondary" disabled={!experimentId} onClick={handleExportAll}>
          Экспорт всех участников
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Участник</th><th>Завершено</th><th>Время (сек)</th>
            <th>Верно</th><th>Неверно</th><th>Пропуски</th><th>Ошибки</th><th></th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <Fragment key={r.id}>
              <tr>
                <td>{r.participant_id}</td>
                <td>{formatApiDate(r.completed_at)}</td>
                <td>{r.total_time_sec.toFixed(2)}</td>
                <td>{r.num_correct}</td>
                <td>{r.num_incorrect}</td>
                <td>{r.num_skipped}</td>
                <td>{r.num_errors}</td>
                <td>
                  <a href={r.download_url} className="btn-link">Скачать</a>{' '}
                  <button type="button" className="btn-link" onClick={() => toggleDetail(r.id)}>
                    {expanded === r.id ? 'Скрыть' : 'Детали'}
                  </button>
                </td>
              </tr>
              {expanded === r.id && detail && (
                <tr>
                  <td colSpan={8}>
                    <table className="data-table nested">
                      <thead>
                        <tr><th>Стимул</th><th>Время реакции</th><th>Код</th><th>Текст</th></tr>
                      </thead>
                      <tbody>
                        {detail.trial_data.map((trial, i) => (
                          <tr key={i}>
                            <td>{trial.stimulus_filename}</td>
                            <td>{trial.reaction_time_sec.toFixed(3)}</td>
                            <td>{trial.code}</td>
                            <td>{trial.recognized_text}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  )
}
