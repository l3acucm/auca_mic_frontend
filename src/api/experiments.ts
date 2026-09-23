import { api, unwrap } from './client'
import type { Experiment, Language, Paginated, Session, StimulusSet, StimulusSetDetail } from '../types'

export async function createStimulusSet(name: string): Promise<StimulusSetDetail> {
  const res = await api.post('/experiments/stimulus-sets/', { name })
  return unwrap<StimulusSetDetail>(res)
}

export async function getStimulusSet(id: string): Promise<StimulusSetDetail> {
  const res = await api.get(`/experiments/stimulus-sets/${id}/`)
  return unwrap<StimulusSetDetail>(res)
}

export async function addStimulus(
  stimulusSetId: string, image: File, answers: string,
): Promise<StimulusSetDetail> {
  const form = new FormData()
  form.append('image', image)
  form.append('answers', answers)
  const res = await api.post(`/experiments/stimulus-sets/${stimulusSetId}/stimuli/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrap<StimulusSetDetail>(res)
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

export async function unarchiveExperiment(id: string): Promise<Experiment> {
  const res = await api.post(`/experiments/experiments/${id}/unarchive/`)
  return unwrap<Experiment>(res)
}

export async function startSession(experimentId: string, participantId?: string): Promise<Session> {
  const res = await api.post(`/experiments/experiments/${experimentId}/start-session/`, {
    participant_id: participantId || '',
  })
  return unwrap<Session>(res)
}
