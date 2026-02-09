/**
 * Universal LLM client — works with any OpenAI-compatible API:
 * - Ollama (http://localhost:11434/v1)
 * - OpenAI (https://api.openai.com/v1)
 * - Any proxy (OpenRouter, Together, LiteLLM, etc.)
 *
 * Config via env:
 *   LLM_BASE_URL  — base URL (default: http://localhost:11434/v1 for Ollama)
 *   LLM_API_KEY   — API key (optional for Ollama, required for OpenAI/proxies)
 *   LLM_MODEL     — model name (default: gemma3:1b)
 */

interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export function getLLMConfig(): LLMConfig {
  return {
    baseUrl: (process.env.LLM_BASE_URL || 'http://localhost:11434/v1').replace(/\/+$/, ''),
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gemma3:1b',
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  config?: Partial<LLMConfig>,
): Promise<string> {
  const cfg = { ...getLLMConfig(), ...config };
  const url = `${cfg.baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (cfg.apiKey) {
    headers['Authorization'] = `Bearer ${cfg.apiKey}`;
  }

  const body = {
    model: cfg.model,
    messages,
    temperature: 0.8,
    max_tokens: 1024,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000), // 60s timeout
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`LLM API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('LLM returned empty response');
  }

  return content.trim();
}

/**
 * Build a tarot interpretation prompt
 */
export interface InterpretRequest {
  spreadType: string;     // 'daily' | 'three-cards' | 'yes-no'
  question: string;
  topic: string;          // 'general' | 'love' | 'career' | 'finances'
  cards: Array<{
    name: string;
    nameEn: string;
    isReversed: boolean;
    position: string;     // "Карта дня", "Прошлое", etc.
    element?: string;
    planet?: string;
  }>;
}

const SYSTEM_PROMPT = `Ты — мудрый и проницательный таролог с многолетним опытом. Ты толкуешь расклады Таро с глубиной, теплотой и мистической атмосферой.

Правила:
- Пиши на русском языке
- Отвечай в 3-5 абзацах, кратко но содержательно
- Связывай карты между собой в общую историю
- Учитывай позицию карты в раскладе (прошлое/настоящее/будущее)
- Если карта перевёрнута, учитывай ослабленное или обратное значение
- Учитывай тему вопроса (любовь/карьера/финансы/общее)
- Заверши советом или напутствием
- Не используй markdown-разметку, пиши простым текстом
- Будь мистичным, но не туманным — давай конкретные трактовки`;

export function buildInterpretPrompt(req: InterpretRequest): ChatMessage[] {
  const cardsDesc = req.cards
    .map((c) => {
      const reversed = c.isReversed ? ' (перевёрнутая)' : '';
      const extra = [c.element, c.planet].filter(Boolean).join(', ');
      return `- Позиция «${c.position}»: ${c.name} / ${c.nameEn}${reversed}${extra ? ` [${extra}]` : ''}`;
    })
    .join('\n');

  const topicLabel: Record<string, string> = {
    general: 'общий вопрос',
    love: 'любовь и отношения',
    career: 'карьера и работа',
    finances: 'финансы и деньги',
  };

  const userMessage = `Расклад: ${req.spreadType === 'daily' ? 'Карта дня' : req.spreadType === 'three-cards' ? 'Три карты (Прошлое — Настоящее — Будущее)' : 'Да/Нет'}
Тема: ${topicLabel[req.topic] || req.topic}
Вопрос: ${req.question}

Выпавшие карты:
${cardsDesc}

Дай целостное толкование расклада.`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];
}
