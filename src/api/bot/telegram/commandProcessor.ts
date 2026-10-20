import * as Sentry from '@sentry/node';
import botCommands from './botCommands.js';
import i18n from '../../../localization/i18n.js';
import type {
  TelegramBotClient,
  TelegramCommand,
  TelegramCommandMessage,
  TelegramMessage,
} from './types.js';

const typedBotCommands: TelegramCommand[] = botCommands;

const process = async (bot: TelegramBotClient, message: TelegramMessage) => {
  if (typeof message.text !== 'string') {
    return false;
  }

  const messageText = message.text;
  const command = typedBotCommands.find((item) =>
    item.regExp.test(messageText),
  );

  if (!command) {
    return false;
  }

  Sentry.setUser({ id: message.chat.id });

  const commandName = command.regExp.toString().replace(/\W+/g, '');
  await Sentry.startSpan({ op: commandName, name: commandName }, async () =>
    command.handler.call(bot, message as TelegramCommandMessage),
  );

  return true;
};

const setCommandMenu = async (bot: TelegramBotClient) =>
  Promise.all(
    Object.keys(i18n.about).map((languageCode) =>
      bot.setMyCommands(
        typedBotCommands
          .filter((command) => !command.hidden)
          .map((command) => ({
            command: command.regExp.toString().replace(/\W+/g, ''), // converts regExp to string
            description: (
              i18n[
                command.description as Exclude<keyof typeof i18n, 't'>
              ] as Record<string, string>
            )[languageCode],
          })),
        languageCode === 'en'
          ? undefined
          : {
              language_code: languageCode,
            },
      ),
    ),
  );

export default { process, setCommandMenu };
