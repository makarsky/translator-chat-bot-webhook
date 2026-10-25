import * as Sentry from '@sentry/node';
import botCommands from './botCommands.js';
import i18n from '../../../localization/i18n.js';
import { buildCommandMenu } from './commandMenuPolicy.js';
import { findCommandMatch, getCommandName } from './commandPolicy.js';
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
  const command = findCommandMatch(typedBotCommands, messageText);

  if (!command) {
    return false;
  }

  Sentry.setUser({ id: message.chat.id });

  const commandName = getCommandName(command.regExp);
  await Sentry.startSpan({ op: commandName, name: commandName }, async () =>
    command.handler.call(bot, message as TelegramCommandMessage),
  );

  return true;
};

const setCommandMenu = async (bot: TelegramBotClient) =>
  Promise.all(
    Object.keys(i18n.about).map((languageCode) => {
      const localizedCommandEntries = buildCommandMenu(
        typedBotCommands
          .filter((command) => !command.hidden)
          .map((command) => ({
            command: getCommandName(command.regExp),
            description: (
              i18n[
                command.description as Exclude<keyof typeof i18n, 't'>
              ] as Record<string, string>
            )[languageCode],
          })),
      );

      return bot.setMyCommands(localizedCommandEntries, languageCode === 'en'
        ? undefined
        : {
            language_code: languageCode,
          });
    }),
  );

export default { process, setCommandMenu };
