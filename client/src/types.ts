// ===== Карты Таро =====

export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export type MajorArcanaNumber =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;

export type MinorArcanaNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface CardMeaning {
  general: string;
  love: string;
  career: string;
  finances: string;
  advice: string;
}

export interface TarotCard {
  id: string;               // e.g. "major-0", "wands-1"
  name: string;             // Русское название
  nameEn: string;           // Английское название
  suit: Suit;
  number: number;
  image: string;            // Путь к изображению
  description: string;      // Описание карты
  upright: CardMeaning;     // Прямое положение
  reversed: CardMeaning;    // Перевёрнутое положение
  yesNo: 'yes' | 'no' | 'maybe'; // Для расклада Да/Нет
  element?: string;         // Стихия (Огонь, Вода, Воздух, Земля)
  planet?: string;          // Планета/знак зодиака
}

// ===== Расклады =====

export type SpreadType = 'daily' | 'three-cards' | 'yes-no';

export interface SpreadPosition {
  index: number;
  label: string;            // "Прошлое", "Настоящее", "Будущее"
  description: string;      // Пояснение позиции
}

export interface SpreadConfig {
  type: SpreadType;
  name: string;
  description: string;
  cardCount: number;
  positions: SpreadPosition[];
  isFree: boolean;
}

// ===== Результат расклада =====

export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  position: SpreadPosition;
}

export interface SpreadResult {
  id: string;
  type: SpreadType;
  question: string;
  topic: ReadingTopic;
  cards: DrawnCard[];
  timestamp: number;
}

// ===== Темы =====

export type ReadingTopic = 'general' | 'love' | 'career' | 'finances';

export interface TopicOption {
  value: ReadingTopic;
  label: string;
  icon: string;
}

// ===== История =====

export interface ReadingHistory {
  readings: SpreadResult[];
}
