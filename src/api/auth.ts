import { api, unwrap } from './client'
import type { TokenPair } from '../types'

// The `domain` must match the Site row in the backend DB (set from the DOMAIN
// env var by the experiments.0002_set_site_domain migration).
const AUTH_DOMAIN = import.meta.env.VITE_AUTH_DOMAIN

// Researchers only — admin-created accounts, phone + password (BRD 1.1/4.1).
export async function login(phoneNumber: string, password: string): Promise<TokenPair> {
  const res = await api.post('/moses/token/obtain/', {
    phone_number: phoneNumber,
    password,
    domain: AUTH_DOMAIN,
  })
  return unwrap<TokenPair>(res)
}
