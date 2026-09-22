import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL
if (!BASE) throw new Error('VITE_API_BASE_URL is not set — check your .env')

export const ACCESS_KEY = 'auca_mic_access'
export const REFRESH_KEY = 'auca_mic_refresh'

export const api = axios.create({ baseURL: BASE })

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH_KEY)
  if (!refresh) return null
  try {
    // Plain axios (not `api`) to avoid the 401 interceptor recursing.
    const res = await axios.post(`${BASE}/moses/token/refresh/`, { refresh })
    const access = res.data?.data?.access
    if (access) {
      localStorage.setItem(ACCESS_KEY, access)
      return access
    }
  } catch {
    /* fall through */
  }
  return null
}

// On 401, transparently refresh the access token once and retry.
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshing = refreshing ?? doRefresh()
      const access = await refreshing
      refreshing = null
      if (access) {
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      }
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    }
    return Promise.reject(error)
  },
)

// Backend wraps every response as { errors: {...}, data: {...} } (moses renderer).
export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data
}

// Pull the first machine-readable error code out of the { errors } envelope.
export function extractErrorCode(err: unknown): string {
  const errors = (err as AxiosError<{ errors?: Record<string, Array<{ error_code?: string }>> }>)
    ?.response?.data?.errors
  if (errors) {
    const first = Object.values(errors)[0]
    if (Array.isArray(first) && first[0]?.error_code) return first[0].error_code
  }
  return 'unknown_error'
}

export function storeTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
