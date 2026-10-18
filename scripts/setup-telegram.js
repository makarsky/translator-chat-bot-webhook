require('dotenv').config();

const commandProcessor = require('../src/api/bot/telegram/commandProcessor');
const { getTelegram } = require('../src/api/bot/telegram/bot');

const setupTelegram = async () => {
  const webhookUrl = process.env.WEBAPP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookUrl.startsWith('https://')) {
    throw new Error('WEBAPP_URL must be the final HTTPS webhook URL');
  }

  if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
    throw new Error(
      'TELEGRAM_WEBHOOK_SECRET must contain 1-256 letters, numbers, underscores, or hyphens',
    );
  }

  const { api, client } = getTelegram();
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
