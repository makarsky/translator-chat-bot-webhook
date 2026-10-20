import { languages as mappedLanguages } from 'google-translate-api-x';
import googleAnalytics from '../../../analytics/google-ga4.js';
import tursoClient from '../../tursoClient.js';
import inlineButtonsBuilder from './inlineButtonsBuilder.js';
import i18n from '../../../localization/i18n.js';
import availableLanguages from '../../availableLanguages.js';
import type {
  TelegramBotClient,
  TelegramCommand,
  TelegramCommandMessage,
} from './types.js';

const mappedLanguagesByCode = mappedLanguages as Record<string, string>;

const setTargetLanguageHandler = async function (
  this: TelegramBotClient,
  message: TelegramCommandMessage,
) {
  const chatSettings = await tursoClient.getChatSettingsById(message.chat.id);
  // Retrieve source information (github, facebook etc).
  const sourceData = message.text.match(/\/start (\w+)/);

  if (chatSettings.source === undefined) {
    chatSettings.source = sourceData ? sourceData[1] : 'organic';
    await tursoClient.setChatSettingsById(message.chat.id, chatSettings);

    await googleAnalytics.event(
      message.from.id,
      googleAnalytics.actions.start,
      chatSettings.source,
    );
  }

  const lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];
  const languages =
    lastUsedLanguageCodes.length > 0
      ? lastUsedLanguageCodes
          .slice(0, inlineButtonsBuilder.maxNumberOfInlineButtons - 1)
          .map((code: string) => ({
            code,
            language: mappedLanguagesByCode[code],
          }))
      : availableLanguages.slice(
          0,
          inlineButtonsBuilder.maxNumberOfInlineButtons - 2,
        );

  await this.sendMessage(
    message.chat.id,
    i18n.t('chooseTargetLanguage', message.from.language_code),
    inlineButtonsBuilder.buildLanguageCodeReplyOptions(
      languages,
      'targetLanguageCode',
      message.from.language_code,
      undefined,
      lastUsedLanguageCodes.length > 0 ? 0 : 1,
    ),
  );

  if (message.text.match(/\/set_target_language/)) {
    await googleAnalytics.event(
      message.from.id,
      googleAnalytics.actions.setTargetLanguage,
    );
  }
};

const botCommands: TelegramCommand[] = [
  {
    regExp: /\/start/,
    description: 'commandDescriptionSetTargetLanguage',
    hidden: true,
    handler: setTargetLanguageHandler,
  },
  {
    regExp: /\/set_target_language/,
    description: 'commandDescriptionSetTargetLanguage',
    hidden: false,
    handler: setTargetLanguageHandler,
  },
  {
    regExp: /\/about/,
    description: 'commandDescriptionAbout',
    hidden: false,
    async handler(this: TelegramBotClient, message: TelegramCommandMessage) {
      // https://core.telegram.org/bots/api#formatting-options
      await this.sendMessage(
        message.chat.id,
        i18n.t('about', message.from.language_code, [
          'https://github.com/makarsky/translator-chat-bot-webhook',
        ]),
        { parse_mode: 'MarkdownV2' },
      );

      await googleAnalytics.event(
        message.from.id,
        googleAnalytics.actions.about,
      );
    },
  },
];

export default botCommands;
