import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { SpreadResult, DrawnCard } from '../types';
import { getCardMeaning, getCardAdvice, getYesNoAnswer } from '../utils/spread';
import { TarotCardComponent } from '../components/TarotCard';
import { StarBackground } from '../components/StarBackground';
import { useTelegram } from '../hooks/useTelegram';
import { useHistory } from '../hooks/useHistory';

const API_URL = import.meta.env.VITE_API_URL || '';

export function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hapticImpact, hapticNotification, backButton } = useTelegram();
  const { addReading } = useHistory();

  const locationState = location.state as { result?: SpreadResult, revealed?: boolean, autoReveal?: boolean };
  const result = locationState?.result;
  const isPreRevealed = locationState?.revealed || false;
  const shouldAutoReveal = locationState?.autoReveal || false;

  const [flippedCards, setFlippedCards] = useState<Set<number>>(
    isPreRevealed && result
      ? new Set(result.cards.map((_, i) => i))
      : new Set()
  );
  const [allRevealed, setAllRevealed] = useState(isPreRevealed);
  const [saved, setSaved] = useState(false);

  const handleCardFlip = useCallback((index: number) => {
    hapticImpact('medium');
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, [hapticImpact]);

  // Автоматическое раскрытие карт, если пришли с этапа раскладки
  useEffect(() => {
    if (shouldAutoReveal && result && !isPreRevealed) {
      const timers: any[] = [];
      result.cards.forEach((_, i) => {
        const timer = setTimeout(() => {
          handleCardFlip(i);
        }, 1200 + i * 1000);
        timers.push(timer);
      });
      return () => timers.forEach(clearTimeout);
    }
  }, [shouldAutoReveal, result, isPreRevealed, handleCardFlip]);

  // Esmeralda interpretation state
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [backButton, navigate]);

  // Сохраняем результат когда все карты открыты
  useEffect(() => {
    if (allRevealed && result && !saved) {
      addReading(result);
      setSaved(true);
    }
  }, [allRevealed, result, saved, addReading]);

  // Запрашиваем толкование Эсмералды когда все карты открыты
  useEffect(() => {
    if (allRevealed && result && !aiText && !aiLoading && !aiError) {
      fetchAiInterpretation(result);
    }
  }, [allRevealed, result]);

  async function fetchAiInterpretation(spread: SpreadResult) {
    console.log('📡 Fetching AI interpretation from:', `${API_URL}/api/interpret`);
    setAiLoading(true);
    setAiError(null);

    try {
      const body = {
        userId: user?.id?.toString(),
        spreadType: spread.type,
        question: spread.question,
        topic: spread.topic,
        cards: spread.cards.map((dc) => ({
          name: dc.card.name,
          nameEn: dc.card.nameEn,
          isReversed: dc.isReversed,
          position: dc.position.label,
          element: dc.card.element,
          planet: dc.card.planet,
        })),
      };

      const res = await fetch(`${API_URL}/api/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setAiText(data.interpretation);
    } catch (err) {
      console.error('AI interpret error:', err);
      setAiError(err instanceof Error ? err.message : 'Ошибка связи с сервером');
    } finally {
      setAiLoading(false);
    }
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 mb-4">Результат не найден</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-purple-600/80 text-white text-sm"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }



  // Следим за тем, когда все карты открыты
  useEffect(() => {
    if (result && flippedCards.size === result.cards.length && !allRevealed) {
      const timer = setTimeout(() => {
        hapticNotification('success');
        setAllRevealed(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [flippedCards.size, result?.cards.length, allRevealed, hapticNotification]);

  const isYesNo = result.type === 'yes-no';

  return (
    <div className="min-h-screen relative pb-8">
      <StarBackground />

      <div className="relative z-10 px-4 pt-6">
        {/* Заголовок */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold text-white/90">Ваш расклад</h1>
          {result.question && (
            <p className="text-sm text-white/40 mt-1 italic">
              "{result.question}"
            </p>
          )}
        </div>

        {/* Подсказка или статус */}
        {!allRevealed && (
          <p className="text-center text-white/40 text-xs mb-4 animate-fade-in-up italic">
            {shouldAutoReveal ? 'Судьба открывается...' : 'Нажмите на карту, чтобы открыть'}
          </p>
        )}

        {/* Карты */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {result.cards.map((drawnCard, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <TarotCardComponent
                card={drawnCard.card}
                isReversed={drawnCard.isReversed}
                isFlipped={flippedCards.has(index)}
                onFlip={() => handleCardFlip(index)}
                size={result.cards.length === 1 ? 'lg' : 'md'}
              />
              <span className="text-xs text-white/40">
                {drawnCard.position.label}
              </span>
            </div>
          ))}
        </div>

        {/* Толкования — появляются после открытия всех карт */}
        {allRevealed && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Да/Нет ответ */}
            {isYesNo && result.cards[0] && (
              <YesNoResult drawnCard={result.cards[0]} />
            )}

            {/* AI Толкование */}
            <AiInterpretation
              text={aiText}
              loading={aiLoading}
              error={aiError}
              onRetry={() => fetchAiInterpretation(result)}
            />

            {/* Детальное толкование каждой карты */}
            {result.cards.map((drawnCard, index) => (
              <CardInterpretation
                key={index}
                drawnCard={drawnCard}
                topic={result.topic}
              />
            ))}

            {/* Кнопки */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  hapticImpact('light');
                  navigate('/');
                }}
                className="w-full p-3 rounded-xl bg-purple-600/80 text-white font-medium
                           hover:bg-purple-600 active:scale-[0.98] transition-all"
              >
                Новый расклад
              </button>
              <button
                onClick={() => {
                  hapticImpact('light');
                  navigate('/history');
                }}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10
                           text-white/60 text-sm hover:bg-white/10 transition-all"
              >
                История раскладов
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AiInterpretation({
  text,
  loading,
  error,
  onRetry,
}: {
  text: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-lg animate-pulse">✨</div>
          <h3 className="text-sm font-semibold text-purple-300">
            Майя толкует карты...
          </h3>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-white/5 rounded animate-pulse" />
          <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-white/5 rounded animate-pulse w-3/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-red-300/80 mb-2">
          Не удалось получить толкование Майи
        </p>
        <p className="text-xs text-white/40 mb-3">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs
                     hover:bg-white/15 transition-all"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <h3 className="text-sm font-semibold text-purple-300">
          Толкование Майи
        </h3>
      </div>
      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}

function YesNoResult({ drawnCard }: { drawnCard: DrawnCard }) {
  const { answer, explanation } = getYesNoAnswer(
    drawnCard.card,
    drawnCard.isReversed,
  );

  const answerColor =
    answer === 'Да'
      ? 'text-green-400'
      : answer === 'Нет'
        ? 'text-red-400'
        : 'text-yellow-400';

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
      <div className={`text-3xl font-bold ${answerColor} mb-2`}>{answer}</div>
      <p className="text-sm text-white/60 leading-relaxed">{explanation}</p>
    </div>
  );
}

function CardInterpretation({
  drawnCard,
  topic,
}: {
  drawnCard: DrawnCard;
  topic: string;
}) {
  const { card, isReversed, position } = drawnCard;
  const meaning = getCardMeaning(card, isReversed, topic as any);
  const advice = getCardAdvice(card, isReversed);

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      {/* Заголовок карты */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
          {position.label}
        </span>
        {isReversed && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
            Перевёрнутая
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-white/90 mb-1">
        {card.name}
      </h3>

      {card.element && (
        <p className="text-xs text-white/30 mb-2">
          {card.element}
          {card.planet ? ` • ${card.planet}` : ''}
        </p>
      )}

      {/* Описание */}
      <p className="text-sm text-white/50 mb-3 italic">{card.description}</p>

      {/* Толкование */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
          Значение
        </h4>
        <p className="text-sm text-white/70 leading-relaxed">{meaning}</p>
      </div>

      {/* Совет */}
      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <h4 className="text-xs font-medium text-purple-300/80 uppercase tracking-wider mb-1">
          Совет карты
        </h4>
        <p className="text-sm text-white/70 leading-relaxed">{advice}</p>
      </div>
    </div>
  );
}
