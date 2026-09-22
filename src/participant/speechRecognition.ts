import type { Language } from '../types'

export function isSpeechRecognitionSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

const LOCALE: Record<Language, string> = { ru: 'ru-RU', en: 'en-US' }

export function createRecognition(language: Language): SpeechRecognitionLike {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Ctor) throw new Error('speech_recognition_unsupported')
  const recognition = new Ctor()
  recognition.lang = LOCALE[language]
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  return recognition
}
