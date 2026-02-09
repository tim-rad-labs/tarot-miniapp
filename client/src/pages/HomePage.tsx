import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SpreadConfig } from '../types';
import { spreads } from '../data';
import { StarBackground } from '../components/StarBackground';
import { SpreadSelector } from '../components/SpreadSelector';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { useTelegram } from '../hooks/useTelegram';

const WELCOME_KEY = 'taro_welcome_seen';

export function HomePage() {
  const navigate = useNavigate();
  const { user, hapticImpact, saveToCloud, loadFromCloud } = useTelegram();
  const [showWelcome, setShowWelcome] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const firstName = user?.first_name || 'Путник';

  useEffect(() => {
    loadFromCloud(WELCOME_KEY).then((value) => {
      if (!value) {
        setShowWelcome(true);
      }
      setLoaded(true);
    });
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    saveToCloud(WELCOME_KEY, 'true');
    hapticImpact('light');
  };

  const handleSpreadSelect = (spread: SpreadConfig) => {
    hapticImpact('light');
    navigate(`/spread/${spread.type}`);
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen relative pb-6">
      <StarBackground />

      {showWelcome && (
        <WelcomeScreen
          userName={firstName}
          onComplete={handleWelcomeComplete}
        />
      )}

      <div className="relative z-10 px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔮</div>
          <h1 className="text-2xl font-bold text-white/90 glow-text">
            Таро Онлайн
          </h1>
          <p className="text-sm text-white/50 mt-2">
            Добро пожаловать, {firstName}
          </p>
        </div>

        {/* Приветственное сообщение */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-white/60 leading-relaxed text-center">
            Сосредоточьтесь на своём вопросе, очистите разум
            и выберите расклад. Карты подскажут путь.
          </p>
        </div>

        {/* Выбор расклада */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white/80 mb-3">
            Выберите расклад
          </h2>
          <SpreadSelector spreads={spreads} onSelect={handleSpreadSelect} />
        </div>

        {/* Кнопка истории */}
        <button
          onClick={() => {
            hapticImpact('light');
            navigate('/history');
          }}
          className="w-full mt-4 p-3 rounded-xl bg-white/5 border border-white/10
                     hover:bg-white/10 transition-all duration-200
                     text-center text-white/50 text-sm"
        >
          📜 История раскладов
        </button>
      </div>
    </div>
  );
}
