import type { ReadingTopic, TopicOption } from '../types';

interface TopicSelectorProps {
  topics: TopicOption[];
  selected: ReadingTopic;
  onChange: (topic: ReadingTopic) => void;
}

export function TopicSelector({ topics, selected, onChange }: TopicSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {topics.map((topic) => (
        <button
          key={topic.value}
          onClick={() => onChange(topic.value)}
          className={`p-3 rounded-xl border transition-all duration-200 text-center
            ${
              selected === topic.value
                ? 'bg-purple-600/30 border-purple-500/50 text-white'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
        >
          <div className="text-xl mb-1">{topic.icon}</div>
          <div className="text-xs font-medium">{topic.label}</div>
        </button>
      ))}
    </div>
  );
}
