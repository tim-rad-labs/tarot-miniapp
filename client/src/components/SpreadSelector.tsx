import type { SpreadConfig } from '../types';

interface SpreadSelectorProps {
  spreads: SpreadConfig[];
  onSelect: (spread: SpreadConfig) => void;
}

const spreadIcons: Record<string, string> = {
  daily: '🌅',
  'three-cards': '🃏',
  'yes-no': '❓',
};

export function SpreadSelector({ spreads, onSelect }: SpreadSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {spreads.map((spread) => (
        <button
          key={spread.type}
          onClick={() => onSelect(spread)}
          className="relative w-full p-4 rounded-xl bg-white/5 border border-white/10
                     hover:bg-white/10 hover:border-purple-500/30
                     active:scale-[0.98] transition-all duration-200
                     text-left group"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0 mt-0.5">
              {spreadIcons[spread.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white/90">
                  {spread.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/20">
                  {spread.cardCount} {spread.cardCount === 1 ? 'карта' : 'карты'}
                </span>
              </div>
              <p className="text-sm text-white/50 mt-1 leading-relaxed">
                {spread.description}
              </p>
            </div>
            <div className="text-white/30 group-hover:text-white/60 transition-colors text-lg">
              →
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
