import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import type { ReadingTopic } from '../types';
import { spreads, topics } from '../data';
import { performSpread } from '../utils/spread';
import { TopicSelector } from '../components/TopicSelector';
import { StarBackground } from '../components/StarBackground';
import { useTelegram } from '../hooks/useTelegram';

type Step = 'topic' | 'question' | 'shuffle' | 'deal' | 'done';

export function SpreadPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { hapticImpact, hapticNotification, backButton } = useTelegram();

  const spread = spreads.find((s) => s.type === type);

  const [step, setStep] = useState<Step>('topic');
  const [selectedTopic, setSelectedTopic] = useState<ReadingTopic>('general');
  const [question, setQuestion] = useState('');
  const [isShuffling, setIsShuffling] = useState(false);
  const [dealtCards, setDealtCards] = useState<number[]>([]);

  // Back button handling
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

  const handleShuffleStart = useCallback(() => {
    if (isShuffling) return;
    setIsShuffling(true);
    hapticImpact('medium');

    setTimeout(() => {
      setIsShuffling(false);
      hapticNotification('success');

      setTimeout(() => {
        setStep('deal');
        if (spread) {
          spread.positions.forEach((_, i) => {
            setTimeout(() => {
              setDealtCards(prev => [...prev, i]);
              hapticImpact('light');
            }, 600 + i * 800);
          });
        }
      }, 400);
    }, 1500);
  }, [isShuffling, spread, hapticImpact, hapticNotification]);

  const handleStartReveal = useCallback(() => {
    if (!spread) return;

    // Генерируем результат и СРАЗУ уходим на страницу результата
    const finalResult = performSpread(
      spread,
      question || 'Карта дня',
      selectedTopic,
    );

    hapticImpact('medium');
    // Передаем флаг autoReveal, чтобы страница результата сама запустила анимацию
    navigate('/result', { state: { result: finalResult, autoReveal: true } });
  }, [spread, question, selectedTopic, hapticImpact, navigate]);

  if (!spread) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Расклад не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-6 overflow-hidden">
      <StarBackground />

      <div className="relative z-10 px-4 pt-8 h-full flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white/90">{spread.name}</h1>
          <p className="text-sm text-white/50 mt-1">{spread.description}</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {step === 'topic' && (
            <div className="animate-fade-in-up w-full">
              <h2 className="text-base font-medium text-white/70 mb-3 text-center">Выберите тему</h2>
              <TopicSelector topics={topics} selected={selectedTopic} onChange={handleTopicSelect} />
            </div>
          )}

          {step === 'question' && (
            <div className="animate-fade-in-up w-full px-2">
              <h2 className="text-base font-medium text-white/70 mb-3 text-center">
                {spread.type === 'daily' ? 'О чём хотите спросить?' : 'Сформулируйте свой вопрос'}
              </h2>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ваш вопрос..."
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white/90 placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 h-24 mb-4"
              />
              <button
                onClick={handleQuestionSubmit}
                className="w-full py-4 rounded-xl bg-purple-600/80 text-white font-bold hover:bg-purple-600 active:scale-[0.98] transition-all"
              >
                Продолжить
              </button>
            </div>
          )}

          {step === 'shuffle' && (
            <div className="animate-fade-in-up text-center w-full">
              <h2 className="text-base font-medium text-white/70 mb-12">
                {isShuffling ? 'Перемешиваем судьбы...' : 'Нажмите на колоду, чтобы перемешать'}
              </h2>
              <div className="relative h-72 flex items-center justify-center mb-12 scale-110">
                <button
                  onClick={handleShuffleStart}
                  disabled={isShuffling}
                  className={`relative w-36 h-52 transition-transform ${isShuffling ? 'cursor-default' : 'active:scale-95 cursor-pointer'}`}
                >
                  <AnimatePresence>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={isShuffling ? {
                          x: [0, i % 2 === 0 ? -120 : 120, 0],
                          rotate: [i * 2, i % 2 === 0 ? -20 : 20, i * 2],
                          scale: [1, 1.05, 1],
                        } : {
                          x: i * 0.5,
                          y: i * -0.5,
                          rotate: (i - 3) * 1.5,
                        }}
                        transition={isShuffling ? { duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 } : { type: "spring" }}
                        className="absolute inset-0 rounded-xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-900/40"
                      >
                        <img src="/cards/backside.png" className="w-full h-full object-cover" alt="Back" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          )}

          {step === 'deal' && (
            <div className="w-full h-full flex flex-col items-center">
              <h2 className="text-base font-medium text-white/70 mb-12 text-center">
                Карты ложатся на стол...
              </h2>

              <div className="relative flex-1 w-full flex items-center justify-center">
                <div className="flex gap-4 items-center justify-center flex-wrap max-w-sm px-4">
                  {spread.positions.map((pos, idx) => {
                    const isDealt = dealtCards.includes(idx);
                    return (
                      <div key={idx} className="relative w-24 h-40">
                        <div className="absolute inset-0 rounded-lg border border-white/5 bg-white/[0.02]" />

                        <AnimatePresence>
                          {isDealt && (
                            <motion.div
                              className="absolute inset-0 z-20"
                              initial={{ y: 400, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 50, damping: 12 }}
                            >
                              <div className="absolute inset-0 rounded-lg overflow-hidden border border-purple-500/30 shadow-2xl">
                                <img src="/cards/backside.png" className="w-full h-full object-cover" alt="Back" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {isDealt && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="absolute -bottom-8 left-0 right-0 text-center">
                              <span className="text-[10px] text-white/40 uppercase font-medium tracking-widest">{pos.label}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {dealtCards.length === spread.cardCount && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full px-4 mt-12 pb-8">
                  <button
                    onClick={handleStartReveal}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-900/40 active:scale-[0.97] transition-all"
                  >
                    Открыть карты
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
