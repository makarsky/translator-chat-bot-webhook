const translate = require('@vitalets/google-translate-api');
const Sentry = require('@sentry/node');
const redisClient = require('../../redisClient');
const availableLanguages = require('../../availableLanguages');
const googleTextToSpeechLanguages = require('../../googleTextToSpeechLanguages');
const googleUa = require('../../../analytics/google-ua');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const botCommands = require('./botCommands');
const i18n = require('../../../localization/i18n');
const filterDuplicatesCallback = require('../../../common/helper/filterDuplicatesCallback');
const translationActions = require('./translationActions');

const maxTextToSpeechLength = 200;

const animulzStickers = [
  'CAACAgEAAxkBAAIG8WHoMt88uW2Hoqt45qJ62WwZJNpvAAJ6EAACmX-IAqU-3GtbhUNmIwQ',
  'CAACAgEAAxkBAAIGy2HoLwq3HGMXq3_U7-aekcwx2SzIAAJ2DwACmX-IAu5NP0uH4Y2nIwQ',
  'CAACAgEAAxkBAAIGzGHoLyw5Kzy9XxND2_mWGwGBpP-KAAI7FAACmX-IArz-u6pndvuMIwQ',
];

const process = async (message, bot) => {
  if (message.text === undefined) {
    await bot.sendSticker(
      message.chat.id,
      animulzStickers[Math.floor(Math.random() * animulzStickers.length)],
    );
    return;
  }

  if (botCommands.some((command) => message.text.match(command.regExp))) {
    return;
  }

  Sentry.setUser({ id: message.chat.id });

  const transaction = Sentry.startTransaction({
    op: 'message',
    name: 'message',
  });

  const requestTargetLanguage = async (text) => {
    await bot.sendMessage(
      message.chat.id,
      text,
      inlineButtonsBuilder.buildLanguageCodeReplyOptions(
        availableLanguages.slice(
          0,
          inlineButtonsBuilder.maxNumberOfInlineButtons - 2,
        ),
        'targetLanguageCode',
        message.from.language_code,
        undefined,
        1,
      ),
    );
  };

  const chatSettings = await redisClient.getChatSettingsById(message.chat.id);
  let lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];

  try {
    if (lastUsedLanguageCodes.length === 0) {
      requestTargetLanguage(
        i18n.t('chooseTargetLanguage', message.from.language_code),
      );
      return;
    }

    let targetLanguageCode = lastUsedLanguageCodes[0];
    let translation = await translate(message.text, { to: targetLanguageCode });

    if (translation.from.language.iso === lastUsedLanguageCodes[0]) {
      if (lastUsedLanguageCodes.length === 1) {
        requestTargetLanguage(
          i18n.t('unsuitableTargetLanguage', message.from.language_code),
        );
        return;
      }
      // eslint-disable-next-line prefer-destructuring
      targetLanguageCode = lastUsedLanguageCodes[1];
      translation = await translate(message.text, { to: targetLanguageCode });
    }

    lastUsedLanguageCodes.unshift(
      targetLanguageCode,
      translation.from.language.iso,
    );
    lastUsedLanguageCodes = lastUsedLanguageCodes.filter(
      filterDuplicatesCallback,
    );
    lastUsedLanguageCodes = lastUsedLanguageCodes.slice(
      0,
      inlineButtonsBuilder.maxNumberOfInlineButtons - 1,
    );
    chatSettings.lastUsedLanguageCodes = lastUsedLanguageCodes;
    chatSettings.updatedAtTimestamp = Date.now();
    await redisClient.setChatSettingsById(message.chat.id, '.', chatSettings);

    const actionButtons = [];
    const audioLanguageCode =
      googleTextToSpeechLanguages.findByCode(targetLanguageCode);

    if (translation.text.length < maxTextToSpeechLength && audioLanguageCode) {
      actionButtons.push({
        text: i18n.t('listen', message.from.language_code),
        callback_data: JSON.stringify({
          translationAction: translationActions.voiceover,
          audioLanguageCode,
        }),
      });
    }

    if (translation.from.text.didYouMean) {
      await bot.sendMessage(
        message.chat.id,
        i18n.t('didYouMean', message.from.language_code, [
          translation.from.text.value,
        ]),
      );

      // Force auto-corrected source-text translation.
      translation = await translate(
        translation.from.text.value.replace(/[[\]]/g, ''),
        { to: targetLanguageCode },
      );
    }

    await bot.sendMessage(
      message.chat.id,
      translation.text,
      actionButtons.length > 0
        ? {
            reply_markup: {
              inline_keyboard: [actionButtons],
            },
          }
        : {},
    );

    googleUa.event(
      message.from.id,
      googleUa.categories.translator,
      googleUa.actions.translate,
      targetLanguageCode,
    );
  } catch (e) {
    console.error('onMessage handler error', e);
    Sentry.captureException(e, {
      contexts: {
        onMessageError: {
          chatId: message.chat.id,
          lastUsedLanguageCodes,
        },
      },
    });
  } finally {
    if (transaction !== undefined) {
      transaction.finish();
    }
  }
};

module.exports = { process };
