import { useState, type FormEvent } from 'react'
import { login } from '../api/auth'
import { extractErrorCode } from '../api/client'
import { useAuth } from './AuthContext'

export function LoginScreen() {
  const { login: setAuthed } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { access, refresh } = await login(phone.trim(), password)
      setAuthed(access, refresh)
    } catch (err) {
      const code = extractErrorCode(err)
      setError(
        code === 'invalid_credentials' || code === 'no_active_account'
          ? 'Неверный телефон или пароль.'
          : `Не удалось войти (${code}).`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="eyebrow">AUCA Mic</div>
        <h1 className="auth-title">Вход для исследователя</h1>
        <p className="auth-sub">
          Аккаунт создаёт администратор. Если у вас его нет — обратитесь к нему.
        </p>
        <form onSubmit={handleSubmit} className="phone-form">
          <label htmlFor="phone">Телефон</label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+996700123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={busy || !phone.trim() || !password}>
            {busy ? 'Входим…' : 'Войти'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
