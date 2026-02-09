import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ReadingTopic, SpreadResult } from '../types';
import { spreads, topics } from '../data';
import { performSpread } from '../utils/spread';
import { TopicSelector } from '../components/TopicSelector';
import { StarBackground } from '../components/StarBackground';
import { useTelegram } from '../hooks/useTelegram';

type Step = 'topic' | 'question' | 'shuffle' | 'done';

export function SpreadPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { hapticImpact, hapticNotification, backButton } = useTelegram();

  const spread = spreads.find((s) => s.type === type);

  const [step, setStep] = useState<Step>('topic');
  const [selectedTopic, setSelectedTopic] = useState<ReadingTopic>('general');
  const [question, setQuestion] = useState('');
  const [shuffleCount, setShuffleCount] = useState(0);

  // Back button
  useState(() => {
    if (backButton) {
      backButton.show();
      const handleBack = () => {
        backButton.hide();
        navigate('/');
      };
      backButton.onClick(handleBack);
      return () => {
        backButton.offClick(handleBack);
        backButton.hide();
      };
    }
  });

  const handleTopicSelect = useCallback((topic: ReadingTopic) => {
    hapticImpact('light');
    setSelectedTopic(topic);
    setStep('question');
  }, [hapticImpact]);

  const handleQuestionSubmit = useCallback(() => {
    if (!question.trim() && spread?.type !== 'daily') return;
    hapticImpact('medium');
    setStep('shuffle');
  }, [question, spread, hapticImpact]);

  const handleShuffle = useCallback(() => {
    hapticImpact('light');
    setShuffleCount((c) => c + 1);

    if (shuffleCount >= 2) {
      // Достаточно перемешано — делаем расклад
      hapticNotification('success');

      if (!spread) return;
      const result: SpreadResult = performSpread(
        spread,
        question || 'Карта дня',
        selectedTopic,
      );

      // Переходим на страницу результата, передавая данные через state
      navigate('/result', { state: { result } });
    }
  }, [shuffleCount, spread, question, selectedTopic, hapticImpact, hapticNotification, navigate]);

  if (!spread) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Расклад не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-6">
      <StarBackground />

      <div className="relative z-10 px-4 pt-8">
        {/* Название расклада */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white/90">{spread.name}</h1>
          <p className="text-sm text-white/50 mt-1">{spread.description}</p>
        </div>

        {/* Шаг 1: Выбор темы */}
        {step === 'topic' && (
          <div className="animate-fade-in-up">
            <h2 className="text-base font-medium text-white/70 mb-3 text-center">
              Выберите тему
            </h2>
            <TopicSelector
              topics={topics}
              selected={selectedTopic}
              onChange={handleTopicSelect}
            />
          </div>
        )}

        {/* Шаг 2: Вопрос */}
        {step === 'question' && (
          <div className="animate-fade-in-up">
            <h2 className="text-base font-medium text-white/70 mb-3 text-center">
              {spread.type === 'daily'
                ? 'О чём хотите спросить? (необязательно)'
                : spread.type === 'yes-no'
                ? 'Задайте вопрос, на который можно ответить Да или Нет'
                : 'Сформулируйте свой вопрос'}
            </h2>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Например: Стоит ли мне менять работу?"
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10
                         text-white/90 placeholder-white/30 text-sm
                         focus:outline-none focus:border-purple-500/50
                         resize-none h-24"
            />
            <button
              onClick={handleQuestionSubmit}
              className="w-full mt-4 p-3 rounded-xl bg-purple-600/80 text-white font-medium
                         hover:bg-purple-600 active:scale-[0.98] transition-all duration-200"
            >
              {spread.type === 'daily' && !question.trim()
                ? 'Продолжить без вопроса'
                : 'Продолжить'}
            </button>
          </div>
        )}

        {/* Шаг 3: Перемешивание */}
        {step === 'shuffle' && (
          <div className="animate-fade-in-up text-center">
            <h2 className="text-base font-medium text-white/70 mb-6">
              Сосредоточьтесь на вопросе и перемешайте карты
            </h2>

            {/* Анимированная колода */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleShuffle}
                className="relative w-36 h-52 active:scale-95 transition-transform"
              >
                {/* Стопка карт */}
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-800 to-purple-900
                               border border-purple-500/30 glow"
                    style={{
                      transform: `rotate(${(i - 2) * 3 + (shuffleCount > 0 ? Math.random() * 6 - 3 : 0)}deg)
                                  translateX(${i * 2}px)`,
                      zIndex: i,
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl">🌙</div>
                        <div className="w-12 h-px bg-purple-400/50 mx-auto my-1" />
                        <div className="text-[10px] text-purple-300/70 tracking-widest">
                          TAROT
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </button>
            </div>

            <p className="text-white/40 text-sm mb-2">
              Нажмите на колоду для перемешивания
            </p>
            <p className="text-white/30 text-xs">
              {shuffleCount === 0
                ? 'Перемешайте минимум 3 раза'
                : shuffleCount < 3
                ? `Перемешано: ${shuffleCount}/3`
                : 'Карты готовы! Нажмите ещё раз для расклада'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
