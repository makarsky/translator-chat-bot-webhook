import 'dotenv/config';
import commandProcessor from '../src/api/bot/telegram/commandProcessor.js';
import telegramBot from '../src/api/bot/telegram/bot.js';

const setupTelegram = async () => {
  const webhookUrl = process.env.WEBHOOK_URL;
  const secret = process.env.WEBHOOK_SECRET;

  if (!webhookUrl || !webhookUrl.startsWith('https://')) {
    throw new Error('WEBHOOK_URL must be the final HTTPS webhook URL');
  }

  if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
    throw new Error(
      'WEBHOOK_SECRET must contain 1-256 letters, numbers, underscores, or hyphens',
    );
  }

  const { api, client } = telegramBot.getTelegram();
  await api.setWebhook(webhookUrl, {
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
  });
  await commandProcessor.setCommandMenu(client);
};

setupTelegram().catch((error) => {
  console.error('Telegram setup failed', error);
  process.exitCode = 1;
});
