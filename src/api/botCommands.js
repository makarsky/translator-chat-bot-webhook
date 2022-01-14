const googleUa = require('../analytics/google-ua');
const redisClient = require('./redisClient');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const i18n = require('../localization/i18n');
const availableLanguages = require('./availableLanguages');

const setTargetLanguageHandler = async function (message) {
  const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
  const lastUsedLanguageCodes = JSON.parse(
    chatSettings.lastUsedLanguageCodes || '[]',
  );
  const languageCodes =
    lastUsedLanguageCodes.length > 0
      ? lastUsedLanguageCodes.slice(
          0,
          inlineButtonsBuilder.maxNumberOfInlineButtons - 1,
        )
      : availableLanguages
          .map((l) => l.code)
          .slice(0, inlineButtonsBuilder.maxNumberOfInlineButtons - 2);

  this.sendMessage(
    message.chat.id,
    i18n.t(
      'chooseTargetLanguage',
      chatSettings.interfaceLanguageCode || message.from.language_code,
    ),
    inlineButtonsBuilder.buildLanguageCodeReplyOptions(
      languageCodes,
      'targetLanguageCode',
      undefined,
      lastUsedLanguageCodes.length > 0 ? 0 : 1,
    ),
  );

  googleUa.event(
    message.from.id,
    googleUa.categories.translator,
    message.text.match(/\/start/)
      ? googleUa.actions.start
      : googleUa.actions.setTargetLanguage,
  );
};

const botCommands = [
  {
    regExp: /\/start/,
    description: 'Set target language',
    hidden: true,
    handler: setTargetLanguageHandler,
  },
  {
    regExp: /\/set_target_language/,
    description: 'Set target language',
    hidden: false,
    handler: setTargetLanguageHandler,
  },
  {
    regExp: /\/about/,
    description: 'About',
    hidden: false,
    async handler(message) {
      const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
      // https://core.telegram.org/bots/api#formatting-options
      this.sendMessage(
        message.chat.id,
        i18n.t(
          'about',
          chatSettings.interfaceLanguageCode || message.from.language_code,
          ['https://github.com/makarsky/translator-chat-bot-webhook'],
        ),
        { parse_mode: 'MarkdownV2' },
      );

      googleUa.event(
        message.from.id,
        googleUa.categories.translator,
        googleUa.actions.about,
      );
    },
  },
  {
    regExp: /\/set_interface_language/,
    description: 'Set interface language',
    hidden: false,
    async handler(message) {
      const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
      this.sendMessage(
        message.chat.id,
        i18n.t(
          'chooseInterfaceLanguage',
          chatSettings.interfaceLanguageCode || message.from.language_code,
        ),
        inlineButtonsBuilder.buildLanguageCodeReplyOptions(
          Object.keys(i18n.chooseTargetLanguage),
          'interfaceLanguageCode',
          undefined,
          1,
        ),
      );

      googleUa.event(
        message.from.id,
        googleUa.categories.translator,
        googleUa.actions.setInterfaceLanguage,
      );
    },
  },
];

module.exports = botCommands;
