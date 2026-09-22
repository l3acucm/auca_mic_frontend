import { Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginScreen } from './auth/LoginScreen'
import { Dashboard } from './researcher/Dashboard'
import { SessionPage } from './participant/SessionPage'

function ResearcherGate() {
  const { isAuthed } = useAuth()
  return isAuthed ? <Dashboard /> : <LoginScreen />
}

export default function App() {
  return (
    <Routes>
      {/* Participant flow: public, no auth (unique session URL, BRD 1.4). */}
      <Route path="/s/:sessionId" element={<SessionPage />} />
      {/* Researcher app: everything else, behind login. */}
      <Route
        path="/*"
        element={
          <AuthProvider>
            <ResearcherGate />
          </AuthProvider>
        }
      />
    </Routes>
  )
}
