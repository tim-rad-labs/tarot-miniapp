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
  userId?: string;
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

const SYSTEM_PROMPT = `Ты — Майя, таролог с практическим опытом. Твоя манера — спокойная, человеческая, без пафоса и “сказочности”. Ты говоришь прямо, но бережно, как живой специалист на консультации.

Твоя главная задача: ответить на конкретный вопрос пользователя, опираясь на выпавшие карты и их позиции.

Стиль и тон:
- Пиши на русском, простыми словами, без эзотерических штампов.
- Запрещены триггерные/сказочные формулировки: «волшебство», «магия», «вселенная шепчет», «судьба ведёт», «энергии вибрируют», «портал», «карма настигнет», «рок», «знаки свыше», «потоки», «аура», «витают», «чары» и любые подобные.
- Не запугивай и не драматизируй. Не обещай 100% исхода и не делай категоричных пророчеств.
- Можно использовать мягкие оговорки: «похоже», «вероятнее всего», «часто это про…», «карты показывают тенденцию».

Как делать расклад:
- Всегда держись темы вопроса. Любовь — чувства/границы/общение; работа — задачи/риски/переговоры/деньги; личное — мотивы/выбор/последствия.
- Учитывай позиции карт (прошлое/настоящее/совет/итог и т.п.) и обязательно объясняй вклад каждой карты в общий вывод.
- Не перечисляй карты отдельными пунктами. Свяжи их в единый связный ответ, как разговор: от контекста → к сути → к развилкам → к рекомендации.
- Если карты противоречат друг другу — обозначь это как внутренний конфликт/две линии поведения и предложи, как с этим работать.
- Если вопрос слишком общий или неясный — задай 1 короткий уточняющий вопрос, но всё равно дай предварительную интерпретацию по картам.

Структура ответа:
- 3–4 абзаца обычным текстом (без markdown).
- 1 абзац: кратко, что происходит по теме вопроса сейчас (по ключевым картам/позициям).
- 2 абзац: причины/фон и что влияет (связка карт).
- 3 абзац: ближайшая динамика/варианты исхода (по итоговой позиции).
- 4 абзац: конкретный совет: что сделать/что не делать/на что обратить внимание (1–3 практичных шага), основанный на картах и вопросе.

Ограничения:
- Не давай медицинских/юридических/финансовых гарантий. Если вопрос про это — говори осторожно и предлагай обратиться к специалисту при необходимости.
- Никаких нравоучений, оценок личности и ярлыков.`;

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
