import express from 'express';
import cors from 'cors';
import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { chatCompletion, buildInterpretPrompt, getLLMConfig } from './llm';
import type { InterpretRequest } from './llm';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-app.vercel.app';
const PORT = parseInt(process.env.PORT || '3001', 10);

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is required. Set it in .env file.');
  process.exit(1);
}

// ===== Express Server =====
const app = express();
app.use(cors());
app.use(express.json());

// Валидация initData от Telegram
function validateInitData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    urlParams.delete('hash');
    const params = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(params)
      .digest('hex');

    return calculatedHash === hash;
  } catch {
    return false;
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Валидация пользователя (для будущих фич: подписки, история на сервере)
app.post('/api/validate', (req, res) => {
  const { initData } = req.body;

  if (!initData || !validateInitData(initData, BOT_TOKEN)) {
    res.status(401).json({ error: 'Invalid init data' });
    return;
  }

  const urlParams = new URLSearchParams(initData);
  const userStr = urlParams.get('user');
  const user = userStr ? JSON.parse(userStr) : null;

  res.json({
    valid: true,
    user: user ? {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
    } : null,
  });
});

// LLM status check
app.get('/api/llm-status', (_req, res) => {
  const config = getLLMConfig();
  res.json({
    configured: true,
    baseUrl: config.baseUrl,
    model: config.model,
    hasApiKey: !!config.apiKey,
  });
});

// AI-толкование расклада
app.post('/api/interpret', async (req, res) => {
  console.log('📥 Received interpret request:', JSON.stringify(req.body, null, 2));
  try {
    const body = req.body as InterpretRequest;

    // Базовая валидация
    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      res.status(400).json({ error: 'cards array is required' });
      return;
    }
    if (!body.spreadType || !body.question) {
      res.status(400).json({ error: 'spreadType and question are required' });
      return;
    }

    const messages = buildInterpretPrompt(body);
    const interpretation = await chatCompletion(messages);

    res.json({ interpretation });
  } catch (err) {
    console.error('LLM interpret error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: `AI interpretation failed: ${message}` });
  }
});

// ===== Telegram Bot =====
const bot = new Telegraf(BOT_TOKEN);

// Команда /start
bot.start((ctx) => {
  const firstName = ctx.from.first_name || 'Путник';

  ctx.reply(
    `🔮 Добро пожаловать, ${firstName}!\n\n` +
    `Эсмералда Нокс — таинственный таролог. Открою скрытые пути судьбы, помогу найти ответы в картах Таро и услышать шёпот Ночи.\n\n` +
    `✨ Доступные расклады:\n` +
    `• Карта дня — узнайте настрой сегодняшнего дня\n` +
    `• Три карты — Прошлое, Настоящее, Будущее\n` +
    `• Да/Нет — быстрый ответ на ваш вопрос\n\n` +
    `Нажмите кнопку ниже, чтобы начать расклад 👇`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🃏 Открыть Таро', WEBAPP_URL)],
    ]),
  );
});

// Команда /help
bot.help((ctx) => {
  ctx.reply(
    `🔮 Таро Онлайн — Помощь\n\n` +
    `Доступные команды:\n` +
    `/start — Начать и открыть приложение\n` +
    `/help — Показать эту справку\n` +
    `/daily — Получить карту дня\n\n` +
    `Для расклада нажмите кнопку «Открыть Таро» в сообщении /start.`,
  );
});

// Быстрая карта дня через бота (без Mini App)
bot.command('daily', (ctx) => {
  ctx.reply(
    `🌅 Для расклада «Карта дня» откройте приложение:`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🃏 Карта дня', WEBAPP_URL)],
    ]),
  );
});

// ===== Запуск =====
async function start() {
  // Запускаем Express
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Запускаем бота (polling для разработки)
  if (process.env.NODE_ENV === 'production') {
    // В продакшене используем webhook
    const webhookDomain = process.env.WEBHOOK_DOMAIN;
    if (webhookDomain) {
      await bot.telegram.setWebhook(`${webhookDomain}/api/webhook`);
      app.use('/api/webhook', (req, res) => {
        bot.handleUpdate(req.body, res);
      });
      console.log('🤖 Bot running in webhook mode');
    }
  } else {
    // В разработке используем long polling
    bot.launch();
    console.log('🤖 Bot running in polling mode');
  }
}

start().catch(console.error);

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
