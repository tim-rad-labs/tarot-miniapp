import type { TarotCard, SpreadConfig, TopicOption } from '../types';
import { majorArcana } from './majorArcana';
import { wands } from './wands';
import { cups } from './cups';
import { swords } from './swords';
import { pentacles } from './pentacles';

// Полная колода 78 карт
export const allCards: TarotCard[] = [
  ...majorArcana,
  ...wands,
  ...cups,
  ...swords,
  ...pentacles,
];

// Конфигурация раскладов
export const spreads: SpreadConfig[] = [
  {
    type: 'daily',
    name: 'Карта дня',
    description: 'Одна карта, которая задаст тон вашему дню и подскажет, на что обратить внимание.',
    cardCount: 1,
    positions: [
      {
        index: 0,
        label: 'Карта дня',
        description: 'Энергия и послание сегодняшнего дня',
      },
    ],
    isFree: true,
  },
  {
    type: 'three-cards',
    name: 'Три карты',
    description: 'Классический расклад: Прошлое, Настоящее и Будущее. Позволяет увидеть развитие ситуации.',
    cardCount: 3,
    positions: [
      {
        index: 0,
        label: 'Прошлое',
        description: 'Что привело к текущей ситуации, корни вопроса',
      },
      {
        index: 1,
        label: 'Настоящее',
        description: 'Текущее положение дел, энергия момента',
      },
      {
        index: 2,
        label: 'Будущее',
        description: 'К чему ведёт ситуация, возможное развитие',
      },
    ],
    isFree: true,
  },
  {
    type: 'yes-no',
    name: 'Да или Нет',
    description: 'Быстрый ответ на конкретный вопрос. Сформулируйте вопрос так, чтобы на него можно было ответить Да или Нет.',
    cardCount: 1,
    positions: [
      {
        index: 0,
        label: 'Ответ',
        description: 'Прямой ответ на ваш вопрос',
      },
    ],
    isFree: true,
  },
];

// Темы для вопросов
export const topics: TopicOption[] = [
  { value: 'general', label: 'Общий вопрос', icon: '🔮' },
  { value: 'love', label: 'Любовь и отношения', icon: '❤️' },
  { value: 'career', label: 'Карьера и работа', icon: '💼' },
  { value: 'finances', label: 'Финансы', icon: '💰' },
];
