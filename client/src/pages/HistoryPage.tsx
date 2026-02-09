import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistory } from '../hooks/useHistory';
import { StarBackground } from '../components/StarBackground';
import { useTelegram } from '../hooks/useTelegram';
import { spreads } from '../data';

export function HistoryPage() {
  const navigate = useNavigate();
  const { hapticImpact, backButton } = useTelegram();
  const { history, isLoading, clearHistory } = useHistory();

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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSpreadName = (type: string) => {
    return spreads.find((s) => s.type === type)?.name || type;
  };

  return (
    <div className="min-h-screen relative pb-6">
      <StarBackground />

      <div className="relative z-10 px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white/90">
            📜 История раскладов
          </h1>
          {history.length > 0 && (
            <button
              onClick={() => {
                hapticImpact('light');
                if (confirm('Очистить всю историю?')) {
                  clearHistory();
                }
              }}
              className="text-xs text-red-400/60 hover:text-red-400"
            >
              Очистить
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-2xl mb-2">🔮</div>
            <p className="text-white/40 text-sm">Загрузка...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🃏</div>
            <p className="text-white/50 text-sm mb-4">
              У вас пока нет раскладов
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 rounded-xl bg-purple-600/80 text-white text-sm"
            >
              Сделать первый расклад
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((reading) => (
              <button
                key={reading.id}
                onClick={() => {
                  hapticImpact('light');
                  navigate('/result', { state: { result: reading } });
                }}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10
                           hover:bg-white/10 transition-all text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/80">
                      {getSpreadName(reading.type)}
                    </div>
                    {reading.question && (
                      <p className="text-xs text-white/40 mt-0.5 truncate italic">
                        "{reading.question}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {reading.cards.map((dc, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50"
                        >
                          {dc.card.name.split(' ')[0]}
                          {dc.isReversed ? ' ↓' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0 ml-2">
                    {formatDate(reading.timestamp)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Кнопка назад */}
        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 p-3 rounded-xl bg-white/5 border border-white/10
                     text-white/50 text-sm hover:bg-white/10 transition-all"
        >
          ← На главную
        </button>
      </div>
    </div>
  );
}
