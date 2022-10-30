const mappedLanguages = require('@vitalets/google-translate-api/languages');
const googleUa = require('../../../analytics/google-ua');
const redisClient = require('../../redisClient');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const i18n = require('../../../localization/i18n');
const availableLanguages = require('../../availableLanguages');

const setTargetLanguageHandler = async function (message) {
  const chatSettings = await redisClient.getChatSettingsById(message.chat.id);
  // Retrieve source information (github, facebook etc).
  const sourceData = message.text.match(/\/start (\w+)/);

  if (chatSettings.source === undefined) {
    chatSettings.source = sourceData ? sourceData[1] : 'organic';
    await redisClient.setChatSettingsById(message.chat.id, '.', chatSettings);

    googleUa.event(
      message.from.id,
      googleUa.categories.translator,
      googleUa.actions.start,
      chatSettings.source,
    );
  }

  const lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];
  const languages =
    lastUsedLanguageCodes.length > 0
      ? lastUsedLanguageCodes
          .slice(0, inlineButtonsBuilder.maxNumberOfInlineButtons - 1)
          .map((code) => ({ code, language: mappedLanguages[code] }))
      : availableLanguages.slice(
          0,
          inlineButtonsBuilder.maxNumberOfInlineButtons - 2,
        );

  this.sendMessage(
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
    googleUa.event(
      message.from.id,
      googleUa.categories.translator,
      googleUa.actions.setTargetLanguage,
    );
  }
};

const botCommands = [
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
    async handler(message) {
      // https://core.telegram.org/bots/api#formatting-options
      this.sendMessage(
        message.chat.id,
        i18n.t('about', message.from.language_code, [
          'https://github.com/makarsky/translator-chat-bot-webhook',
        ]),
        { parse_mode: 'MarkdownV2' },
      );

      googleUa.event(
        message.from.id,
        googleUa.categories.translator,
        googleUa.actions.about,
      );
    },
  },
];

module.exports = botCommands;
