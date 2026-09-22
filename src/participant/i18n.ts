import type { Language } from '../types'

export const strings: Record<Language, Record<string, string>> = {
  ru: {
    introTitle: 'Психолингвистический эксперимент',
    introBody: 'Вам будут показаны изображения объектов. Назовите вслух то, что видите на экране.',
    dontKnow: 'Не знаю',
    instruction: 'Назовите объект на экране',
    start: 'Начать попытку',
    listening: 'Слушаю…',
    micLevelHint: 'Уровень микрофона — говорите, пока полоса не дойдёт до отметки',
    finishTitle: 'Попытка завершена! Спасибо!',
    finishBody: 'Ваши ответы сохранены.',
    unsupported: 'Этот браузер не поддерживает распознавание речи. Откройте ссылку в Chrome.',
    alreadyDone: 'Эта попытка уже завершена.',
    loadError: 'Не удалось загрузить эксперимент. Проверьте ссылку.',
  },
  en: {
    introTitle: 'Psycholinguistic naming experiment',
    introBody: 'You will see images of objects. Say out loud what you see on the screen.',
    dontKnow: "I don't know",
    instruction: 'Name the object on the screen',
    start: 'Start attempt',
    listening: 'Listening…',
    micLevelHint: 'Microphone level — speak until the bar reaches the mark',
    finishTitle: 'Attempt finished! Thank you!',
    finishBody: 'Your answers have been saved.',
    unsupported: 'This browser does not support speech recognition. Please open the link in Chrome.',
    alreadyDone: 'This attempt is already completed.',
    loadError: 'Could not load the experiment. Check the link.',
  },
}
