import { api, unwrap } from './client'
import type { Experiment, Language, Paginated, Session, StimulusSet } from '../types'

export async function uploadStimulusSet(archive: File, name: string): Promise<StimulusSet> {
  const form = new FormData()
  form.append('archive', archive)
  if (name) form.append('name', name)
  const res = await api.post('/experiments/stimulus-sets/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrap<StimulusSet>(res)
}

export async function listStimulusSets(): Promise<StimulusSet[]> {
  const res = await api.get('/experiments/stimulus-sets/')
  return unwrap<Paginated<StimulusSet>>(res).results
}

export interface CreateExperimentInput {
  name: string
  description: string
  language: Language
  num_trials: number
  stimulus_set: string
}

export async function createExperiment(input: CreateExperimentInput): Promise<Experiment> {
  const res = await api.post('/experiments/experiments/', input)
  return unwrap<Experiment>(res)
}

export async function listExperiments(): Promise<Experiment[]> {
  const res = await api.get('/experiments/experiments/')
  return unwrap<Paginated<Experiment>>(res).results
}

export async function updateExperiment(
  id: string,
  patch: { name?: string; description?: string },
): Promise<Experiment> {
  const res = await api.patch(`/experiments/experiments/${id}/`, patch)
  return unwrap<Experiment>(res)
}

export async function archiveExperiment(id: string): Promise<Experiment> {
  const res = await api.post(`/experiments/experiments/${id}/archive/`)
  return unwrap<Experiment>(res)
}

export async function startSession(experimentId: string, participantId?: string): Promise<Session> {
  const res = await api.post(`/experiments/experiments/${experimentId}/start-session/`, {
    participant_id: participantId || '',
  })
  return unwrap<Session>(res)
}
