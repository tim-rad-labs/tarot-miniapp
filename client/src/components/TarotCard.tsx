import { useState } from 'react';
import type { TarotCard as TarotCardType } from '../types';

interface TarotCardProps {
  card: TarotCardType;
  isReversed: boolean;
  isFlipped: boolean;
  onFlip?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-24 h-40',
  md: 'w-36 h-56',
  lg: 'w-44 h-72',
};

export function TarotCardComponent({
  card,
  isReversed,
  isFlipped,
  onFlip,
  size = 'md',
}: TarotCardProps) {
  const [hasFlipped, setHasFlipped] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleClick = () => {
    if (!hasFlipped && onFlip) {
      setHasFlipped(true);
      onFlip();
    }
  };

  return (
    <div
      className={`card-flip ${sizeClasses[size]} cursor-pointer select-none`}
      onClick={handleClick}
    >
      <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>
        {/* Рубашка карты */}
        <div className="card-front absolute inset-0 rounded-xl overflow-hidden border border-purple-500/30 glow">
          <img
            src="/cards/backside.png"
            alt="Card Back"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Лицевая сторона — настоящая картинка */}
        <div
          className="card-back absolute inset-0 rounded-xl border border-white/20 overflow-hidden"
          style={isReversed ? { transform: 'rotateY(180deg) rotateZ(180deg)' } : { transform: 'rotateY(180deg)' }}
        >
          {/* Картинка карты */}
          <img
            src={card.image}
            alt={card.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            loading="eager"
          />

          {/* Фоллбэк пока грузится */}
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
              <div className="text-white/50 text-xs text-center px-2">{card.name}</div>
            </div>
          )}

          {/* Подпись внизу */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 pt-4">
            <div className="text-[9px] text-white/90 font-medium text-center leading-tight truncate">
              {card.name}
            </div>
            {isReversed && (
              <div className="text-[7px] text-yellow-300/80 text-center mt-0.5">
                Перевёрнутая
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
