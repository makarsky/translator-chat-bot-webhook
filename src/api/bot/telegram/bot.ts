import { Api } from 'grammy';
import { createTelegramClient } from './telegramClientFactory.js';
import type { TelegramBotClient, TelegramUpdate } from './types.js';
import dispatchUpdate from './updateDispatcher.js';

let telegram: { api: Api; client: TelegramBotClient } | undefined;

const getTelegram = () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  if (!telegram) {
    const api = new Api(process.env.TELEGRAM_BOT_TOKEN);
    const client = createTelegramClient(api);

    telegram = { api, client };
  }

  return telegram;
};

const processUpdate = (update: TelegramUpdate) =>
  dispatchUpdate(update, getTelegram().client);

export default { getTelegram, processUpdate };
