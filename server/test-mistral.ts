/**
 * Тестовый скрипт для проверки работы Mistral AI
 * Запуск: tsx test-mistral.ts
 */

import dotenv from 'dotenv';
import { chatCompletion, getLLMConfig } from './src/llm';

dotenv.config();

async function testMistral() {
    console.log('🔮 Тестирование Mistral AI...\n');

    // Проверяем конфигурацию
    const config = getLLMConfig();
    console.log('📋 Конфигурация:');
    console.log('  Base URL:', config.baseUrl);
    console.log('  Model:', config.model);
    console.log('  API Key:', config.apiKey ? '✅ Установлен' : '❌ Не установлен');
    console.log();

    if (!config.apiKey) {
        console.error('❌ Ошибка: LLM_API_KEY не установлен в .env файле');
        console.log('Добавьте в .env:');
        console.log('LLM_API_KEY=your_mistral_api_key_here');
        process.exit(1);
    }

    try {
        console.log('🤖 Отправка тестового запроса...\n');

        const messages = [
            {
                role: 'user' as const,
                content: 'What is the best French cheese? Answer in one sentence.',
            },
        ];

        const response = await chatCompletion(messages);

        console.log('✅ Ответ от Mistral AI:');
        console.log('─'.repeat(60));
        console.log(response);
        console.log('─'.repeat(60));
        console.log('\n✨ Mistral AI работает корректно!');
    } catch (error) {
        console.error('\n❌ Ошибка при запросе к Mistral AI:');
        if (error instanceof Error) {
            console.error('  Сообщение:', error.message);
            console.error('  Stack:', error.stack);
        } else {
            console.error('  ', error);
        }
        process.exit(1);
    }
}

// Тест толкования Таро
async function testTarotInterpretation() {
    console.log('\n\n🔮 Тестирование толкования Таро...\n');

    try {
        const messages = [
            {
                role: 'system' as const,
                content: `Ты — мудрый и проницательный таролог с многолетним опытом. Ты толкуешь расклады Таро с глубиной, теплотой и мистической атмосферой.

Правила:
- Пиши на русском языке
- Отвечай в 3-5 абзацах, кратко но содержательно
- Связывай карты между собой в общую историю
- Учитывай позицию карты в раскладе (прошлое/настоящее/будущее)
- Если карта перевёрнута, учитывай ослабленное или обратное значение
- Учитывай тему вопроса (любовь/карьера/финансы/общее)
- Заверши советом или напутствием
- Не используй markdown-разметку, пиши простым текстом
- Будь мистичным, но не туманным — давай конкретные трактовки`,
            },
            {
                role: 'user' as const,
                content: `Расклад: Карта дня
Тема: общий вопрос
Вопрос: Что меня ждёт сегодня?

Выпавшие карты:
- Позиция «Карта дня»: Шут / The Fool [воздух]

Дай целостное толкование расклада.`,
            },
        ];

        const interpretation = await chatCompletion(messages);

        console.log('✅ Толкование Таро от Mistral AI:');
        console.log('─'.repeat(60));
        console.log(interpretation);
        console.log('─'.repeat(60));
        console.log('\n✨ Толкование Таро работает корректно!');
    } catch (error) {
        console.error('\n❌ Ошибка при толковании Таро:');
        if (error instanceof Error) {
            console.error('  Сообщение:', error.message);
        }
    }
}

// Запускаем тесты
testMistral()
    .then(() => testTarotInterpretation())
    .then(() => {
        console.log('\n✅ Все тесты пройдены успешно!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Тесты провалены:', error);
        process.exit(1);
    });
