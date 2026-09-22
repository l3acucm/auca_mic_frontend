import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ExperimentsPanel } from './ExperimentsPanel'
import { ResultsPanel } from './ResultsPanel'
import { StimulusSetsPanel } from './StimulusSetsPanel'

type Tab = 'stimulus-sets' | 'experiments' | 'results'

export function Dashboard() {
  const { logout } = useAuth()
  const [tab, setTab] = useState<Tab>('experiments')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <span className="eyebrow">AUCA Mic</span>
        <nav>
          <button
            type="button" className={tab === 'stimulus-sets' ? 'tab active' : 'tab'}
            onClick={() => setTab('stimulus-sets')}
          >
            Стимулы
          </button>
          <button
            type="button" className={tab === 'experiments' ? 'tab active' : 'tab'}
            onClick={() => setTab('experiments')}
          >
            Эксперименты
          </button>
          <button
            type="button" className={tab === 'results' ? 'tab active' : 'tab'}
            onClick={() => setTab('results')}
          >
            Результаты
          </button>
        </nav>
        <button type="button" className="btn-link" onClick={logout}>Выйти</button>
      </header>
      <main>
        {tab === 'stimulus-sets' && (
          <StimulusSetsPanel onChanged={() => setRefreshKey((k) => k + 1)} />
        )}
        {tab === 'experiments' && <ExperimentsPanel refreshKey={refreshKey} />}
        {tab === 'results' && <ResultsPanel />}
      </main>
    </div>
  )
}
