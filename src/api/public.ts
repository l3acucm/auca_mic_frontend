import { api, unwrap } from './client'
import type { PublicSessionState, TrialEvent } from '../types'

export async function getSession(sessionId: string): Promise<PublicSessionState> {
  const res = await api.get(`/public/sessions/${sessionId}/`)
  return unwrap<PublicSessionState>(res)
}

export interface TrialInput {
  stimulus_filename: string
  reaction_time_sec: number
  recognized_text: string
  event: TrialEvent
  timestamp_stimulus: string
  timestamp_speech_start: string | null
}

export async function postTrial(sessionId: string, trial: TrialInput): Promise<{ code: number }> {
  const res = await api.post(`/public/sessions/${sessionId}/trials/`, trial)
  return unwrap(res)
}

export async function completeSession(sessionId: string): Promise<{ status: string; result_id: string }> {
  const res = await api.post(`/public/sessions/${sessionId}/complete/`)
  return unwrap(res)
}
