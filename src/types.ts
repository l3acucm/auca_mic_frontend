export interface TokenPair {
  access: string
  refresh: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface StimulusSet {
  id: string
  name: string
  stimulus_count: number
  created_at: string
}

export interface StimulusItem {
  filename: string
  answers: string[]
  url: string
}

export interface StimulusSetDetail extends StimulusSet {
  stimuli: StimulusItem[]
}

export type Language = 'ru' | 'en'
export type ExperimentStatus = 'active' | 'archived'

export interface Experiment {
  id: string
  name: string
  description: string
  language: Language
  num_trials: number
  status: ExperimentStatus
  created_at: string
  updated_at?: string
  stimulus_set?: StimulusSet
}

export interface Session {
  id: string
  experiment: string
  participant_id: string
  status: 'pending' | 'in_progress' | 'completed'
  session_url: string
  created_at: string
}

export interface ResultRow {
  id: string
  experiment: string
  participant_id: string
  completed_at: string
  total_time_sec: number
  num_correct: number
  num_incorrect: number
  num_skipped: number
  num_errors: number
  download_url: string
}

export interface Trial {
  stimulus_filename: string
  reaction_time_sec: number
  code: 0 | 1 | 2 | 3
  timestamp_stimulus: string
  timestamp_speech_start: string | null
}

export interface ResultDetail extends ResultRow {
  trial_data: Trial[]
}

export interface PublicStimulus {
  filename: string
  url: string
}

export interface PublicSessionState {
  id: string
  status: 'pending' | 'in_progress' | 'completed'
  language: Language
  num_trials: number
  stimuli: PublicStimulus[]
}

export type TrialEvent = 'recognized' | 'skipped' | 'timeout' | 'speech_error'
