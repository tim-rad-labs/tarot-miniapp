import type { TarotCard, DrawnCard, SpreadConfig, SpreadResult, ReadingTopic } from '../types';
import { allCards } from '../data';

/**
 * Fisher-Yates shuffle — перемешивание колоды
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Генерация уникального ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Выполнить расклад — вытянуть карты
 */
export function performSpread(
  spread: SpreadConfig,
  question: string,
  topic: ReadingTopic,
): SpreadResult {
  const shuffled = shuffleArray(allCards);
  const drawnCards: DrawnCard[] = spread.positions.map((position, index) => {
    const card = shuffled[index];
    // ~30% шанс перевёрнутой карты
    const isReversed = Math.random() < 0.3;
    return {
      card,
      isReversed,
      position,
    };
  });

  return {
    id: generateId(),
    type: spread.type,
    question,
    topic,
    cards: drawnCards,
    timestamp: Date.now(),
  };
}

/**
 * Получить толкование карты в зависимости от темы и положения
 */
export function getCardMeaning(
  card: TarotCard,
  isReversed: boolean,
  topic: ReadingTopic,
): string {
  const meanings = isReversed ? card.reversed : card.upright;
  return meanings[topic] || meanings.general;
}

/**
 * Получить совет карты
 */
export function getCardAdvice(card: TarotCard, isReversed: boolean): string {
  const meanings = isReversed ? card.reversed : card.upright;
  return meanings.advice;
}

/**
 * Интерпретация Да/Нет с учётом перевёрнутости
 */
export function getYesNoAnswer(card: TarotCard, isReversed: boolean): {
  answer: string;
  explanation: string;
} {
  if (isReversed) {
    // Перевёрнутая карта инвертирует ответ
    switch (card.yesNo) {
      case 'yes':
        return {
          answer: 'Скорее нет',
          explanation: 'Карта в перевёрнутом положении указывает на препятствия. То, о чём вы спрашиваете, может не реализоваться или потребует значительных усилий.',
        };
      case 'no':
        return {
          answer: 'Возможно да',
          explanation: 'Перевёрнутое положение смягчает негативное значение. Есть шанс, но ситуация потребует от вас работы над собой.',
        };
      case 'maybe':
        return {
          answer: 'Неопределённо',
          explanation: 'Карты говорят, что ответ зависит целиком от ваших действий. Сейчас не время для однозначных ответов — прислушайтесь к интуиции.',
        };
    }
  }

  switch (card.yesNo) {
    case 'yes':
      return {
        answer: 'Да',
        explanation: 'Карта даёт утвердительный ответ. Энергия благоприятна для того, о чём вы спрашиваете.',
      };
    case 'no':
      return {
        answer: 'Нет',
        explanation: 'Карта указывает на то, что сейчас не лучшее время для этого. Возможно, стоит пересмотреть свой подход или подождать.',
      };
    case 'maybe':
      return {
        answer: 'Может быть',
        explanation: 'Ответ зависит от обстоятельств и ваших решений. Карта призывает вас быть внимательнее к деталям.',
      };
  }
}
