import { api, unwrap } from './client'
import type { Paginated, ResultDetail, ResultRow } from '../types'

export interface ResultFilters {
  experiment?: string
  participant_id?: string
  date_from?: string
  date_to?: string
}

export async function listResults(filters: ResultFilters = {}): Promise<ResultRow[]> {
  const res = await api.get('/experiments/results/', { params: filters })
  return unwrap<Paginated<ResultRow>>(res).results
}

export async function getResult(id: string): Promise<ResultDetail> {
  const res = await api.get(`/experiments/results/${id}/`)
  return unwrap<ResultDetail>(res)
}

export async function downloadExperimentExport(experimentId: string): Promise<Blob> {
  const res = await api.get('/experiments/results/export/', {
    params: { experiment: experimentId },
    responseType: 'blob',
  })
  return res.data
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
