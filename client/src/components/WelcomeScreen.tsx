import { useState } from 'react';

interface WelcomeScreenProps {
  userName: string;
  onComplete: () => void;
}

const steps = [
  {
    icon: '🔮',
    title: 'Добро пожаловать в Таро Онлайн',
    text: 'Это ваш персональный проводник в мир карт Таро. Задайте вопрос — и карты подскажут ответ.',
  },
  {
    icon: '🃏',
    title: 'Как это работает?',
    text: 'Выберите расклад, сосредоточьтесь на вопросе, перемешайте карты касаниями и откройте их, чтобы узнать толкование.',
  },
  {
    icon: '✨',
    title: 'Три расклада на выбор',
    text: '🌅 Карта дня — настрой на сегодня\n🃏 Три карты — прошлое, настоящее, будущее\n❓ Да/Нет — быстрый ответ на вопрос',
  },
];

export function WelcomeScreen({ userName, onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 p-6 text-center">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-purple-500' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="text-5xl mb-4 animate-fade-in-up">{current.icon}</div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white/90 mb-3 glow-text">
          {step === 0 ? current.title.replace('Таро Онлайн', '') : current.title}
          {step === 0 && (
            <>
              <br />
              <span className="text-purple-400">Таро Онлайн</span>
            </>
          )}
        </h2>

        {/* Text */}
        <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line mb-6">
          {current.text}
        </p>

        {/* Greeting on first step */}
        {step === 0 && (
          <p className="text-xs text-purple-300/60 mb-4">
            {userName}, карты уже ждут вас
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white/50 text-sm hover:bg-white/10 transition-all"
            >
              Назад
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
            className="flex-1 py-3 rounded-xl bg-purple-600/80 border border-purple-500/30
                       text-white font-medium text-sm hover:bg-purple-600 transition-all
                       active:scale-95"
          >
            {isLast ? 'Начать расклад' : 'Далее'}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="mt-3 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            Пропустить
          </button>
        )}
      </div>
    </div>
  );
}
