const mappedLanguages = require('@vitalets/google-translate-api/languages');
const Sentry = require('@sentry/node');
const googleTTS = require('google-tts-api');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const googleUa = require('../../../analytics/google-ua');
const i18n = require('../../../localization/i18n');
const availableLanguages = require('../../availableLanguages');
const redisClient = require('../../redisClient');
const voiceoverService = require('../../voiceoverService');
const filterDuplicatesCallback = require('../../../common/helper/filterDuplicatesCallback');
const translationActions = require('./translationActions');

const processTargetLanguageCodeCallbackQuery = async (bot, data, message) => {
  const chatSettings = await redisClient.getChatSettingsById(message.chat.id);
  let lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];
  lastUsedLanguageCodes.unshift(data.targetLanguageCode);
  lastUsedLanguageCodes = lastUsedLanguageCodes.filter(
    filterDuplicatesCallback,
  );
  lastUsedLanguageCodes = lastUsedLanguageCodes.slice(
    0,
    inlineButtonsBuilder.maxNumberOfInlineButtons - 1,
  );
  chatSettings.lastUsedLanguageCodes = lastUsedLanguageCodes;

  await redisClient.setChatSettingsById(message.chat.id, '.', chatSettings);

  const targetLanguage = mappedLanguages[data.targetLanguageCode];

  googleUa.event(
    message.from.id,
    googleUa.categories.translator,
    googleUa.actions.targetLanguageSelected,
    data.targetLanguageCode,
  );

  try {
    await bot.editMessageText(
      i18n.t('targetLanguageStatus', data.userLocale, [
        targetLanguage,
        data.targetLanguageCode,
      ]),
      {
        chat_id: message.chat.id,
        message_id: message.message_id,
      },
    );
  } catch (e) {
    console.log('targetLanguageStatus duplicate');
    Sentry.captureException(e, {
      contexts: {
        editMessageTextError: {
          text: 'targetLanguageStatus',
        },
      },
    });
  }
};

const processPageCallbackQuery = async (bot, data, message) => {
  const itemsPerPage = inlineButtonsBuilder.maxNumberOfInlineButtons - 2;
  const pageCount = Math.ceil(availableLanguages.length / itemsPerPage);
  const offset = data.page * itemsPerPage;
  let languages = availableLanguages.slice(offset, offset + itemsPerPage);
  let previousPage;
  let nextPage;

  const chatSettings = await redisClient.getChatSettingsById(message.chat.id);
  const lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];

  if (data.page === -1) {
    languages = lastUsedLanguageCodes
      .slice(0, inlineButtonsBuilder.maxNumberOfInlineButtons - 1)
      .map((code) => ({ code, language: mappedLanguages[code] }));
    nextPage = 0;
  } else if (data.page === 0) {
    nextPage = data.page + 1;

    if (lastUsedLanguageCodes.length > 0) {
      previousPage = data.page - 1;
    }
  } else if (data.page + 1 === pageCount) {
    previousPage = data.page - 1;
  } else {
    nextPage = data.page + 1;
    previousPage = data.page - 1;
  }

  try {
    await bot.editMessageText(i18n.t('chooseTargetLanguage', data.userLocale), {
      chat_id: message.chat.id,
      message_id: message.message_id,
      ...inlineButtonsBuilder.buildLanguageCodeReplyOptions(
        languages,
        'targetLanguageCode',
        data.userLocale,
        previousPage,
        nextPage,
      ),
    });
  } catch (e) {
    console.log('chooseTargetLanguage duplicate');
    Sentry.captureException(e, {
      contexts: {
        editMessageTextError: {
          text: 'chooseTargetLanguage',
        },
      },
    });
  }
};

const processTranslationActionCallbackQuery = async (bot, data, message) => {
  if (data.translationAction === translationActions.voiceover) {
    let audioUrl = '';

    try {
      audioUrl = googleTTS.getAudioUrl(message.text, {
        lang: data.audioLanguageCode,
        slow: false,
        host: 'https://translate.google.com',
      });

      await voiceoverService.downloadAudioFile(audioUrl, message.text);

      await bot.sendAudio(
        message.chat.id,
        voiceoverService.getVoiceoverStream(message.text),
        {
          caption: message.text,
          performer: 't.me/ProTranslatorBot',
          title: message.text,
        },
        { filename: message.text, contentType: 'audio/mpeg' },
      );

      voiceoverService.removeAudioFile(message.text);

      googleUa.event(
        message.from.id,
        googleUa.categories.translator,
        googleUa.actions.listen,
      );

      try {
        await bot.editMessageText(message.text, {
          chat_id: message.chat.id,
          message_id: message.message_id,
        });
      } catch (e) {
        console.log('translationActionListen duplicate');
        Sentry.captureException(e, {
          contexts: {
            editMessageTextError: {
              text: 'translationActionListen',
            },
          },
        });
      }
    } catch (e) {
      console.log(
        'audioUrl error',
        e,
        message.text,
        audioUrl,
        data.audioLanguageCode,
      );

      Sentry.captureException(e, {
        contexts: {
          audioUrlError: {
            chatId: message.chat.id,
            audioLanguageCode: data.audioLanguageCode,
          },
        },
      });
    }
  }

  // TODO: add more actions (slow voiceover, picture)?
};

const process = async (callback, bot) => {
  if (!callback.data || !callback.message) {
    return;
  }

  // Warning! There is no message.from.language_code in the callback_query.
  // Use callback.data.userLocale instead.
  const { message } = callback;

  Sentry.setUser({ id: message.chat.id });

  const transaction = Sentry.startTransaction({
    op: 'callback_query',
    name: 'callback_query',
  });

  const data = JSON.parse(callback.data);

  // A new target language is selected
  if (data.targetLanguageCode !== undefined) {
    processTargetLanguageCodeCallbackQuery(bot, data, message);
  }

  // A new target language page is selected
  if (data.page !== undefined) {
    processPageCallbackQuery(bot, data, message);
  }

  // A translated text action is selected
  if (data.translationAction !== undefined) {
    processTranslationActionCallbackQuery(bot, data, message);
  }

  if (transaction !== undefined) {
    transaction.finish();
  }
};

module.exports = { process };
