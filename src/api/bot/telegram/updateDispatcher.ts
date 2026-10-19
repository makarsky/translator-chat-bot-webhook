const commandProcessor = require('./commandProcessor');
const messageProcessor = require('./messageProcessor');
const callbackQueryProcessor = require('./callbackQueryProcessor');
import type {
  TelegramBotClient,
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from './types';

interface UpdateProcessors {
  commandProcessor: {
    process(bot: TelegramBotClient, message: TelegramMessage): Promise<boolean>;
  };
  messageProcessor: {
    process(message: TelegramMessage, bot: TelegramBotClient): Promise<void>;
  };
  callbackQueryProcessor: {
    process(
      callback: TelegramCallbackQuery,
      bot: TelegramBotClient,
    ): Promise<void>;
  };
}

const dispatchUpdate = async (
  update: TelegramUpdate,
  bot: TelegramBotClient,
  processors: UpdateProcessors = {
    commandProcessor,
    messageProcessor,
    callbackQueryProcessor,
  },
) => {
  if (update.message) {
    const handled = await processors.commandProcessor.process(
      bot,
      update.message,
    );

    if (!handled) {
      await processors.messageProcessor.process(update.message, bot);
    }
    return;
  }

  if (update.callback_query) {
    await processors.callbackQueryProcessor.process(update.callback_query, bot);
  }
};

module.exports = dispatchUpdate;
