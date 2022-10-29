const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const translate = require('@vitalets/google-translate-api');
const googleTTS = require('google-tts-api');
const Sentry = require('@sentry/node');
const mappedLanguages = require('@vitalets/google-translate-api/languages');
const https = require('https');
const fs = require('fs');
const redisClient = require('./redisClient');
const availableLanguages = require('./availableLanguages');
const googleTextToSpeechLanguages = require('./googleTextToSpeechLanguages');
const googleUa = require('../analytics/google-ua');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const botCommands = require('./botCommands');
const i18n = require('../localization/i18n');

const router = express.Router();

const bot = new TelegramBot(process.env.TOKEN);

bot.on('polling_error', (e) => console.log('polling_error', e));

const maxTextToSpeechLength = 200;
const translationActionListen = 'listen';
const animulzStickers = [
  'CAACAgEAAxkBAAIG8WHoMt88uW2Hoqt45qJ62WwZJNpvAAJ6EAACmX-IAqU-3GtbhUNmIwQ',
  'CAACAgEAAxkBAAIGy2HoLwq3HGMXq3_U7-aekcwx2SzIAAJ2DwACmX-IAu5NP0uH4Y2nIwQ',
  'CAACAgEAAxkBAAIGzGHoLyw5Kzy9XxND2_mWGwGBpP-KAAI7FAACmX-IArz-u6pndvuMIwQ',
];

const filterDuplicatesCallback = (v, i, a) => v && i === a.indexOf(v);

const voiceoverDir = 'var/voiceover/';

const downloadAudioFile = async (audioUrl, fileName) => {
  const file = fs.createWriteStream(`${voiceoverDir}/${fileName}`);

  return new Promise((resolve, reject) => {
    https
      .get(audioUrl, (response) => {
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const removeAudioFile = (fileName) => {
  fs.unlink(`${voiceoverDir}/${fileName}`, (err) => {
    if (err && err.code === 'ENOENT') {
      // file doens't exist
      console.info("File doesn't exist, won't remove it.");
    } else if (err) {
      // other errors, e.g. maybe we don't have enough permission
      console.error('Error occurred while trying to remove file');
    } else {
      console.info(`removed`);
    }
  });
};

botCommands.forEach((command) =>
  bot.onText(command.regExp, (message, match) => {
    Sentry.setUser({ id: message.chat.id });

    const transaction = Sentry.startTransaction({
      op: command.regExp.toString().replace(/\W+/g, ''),
      name: command.regExp.toString().replace(/\W+/g, ''),
    });

    try {
      command.handler.bind(bot)(message, match);
    } finally {
      if (transaction !== undefined) {
        transaction.finish();
      }
    }
  }),
);

Object.keys(i18n.about).forEach((languageCode) => {
  bot.setMyCommands(
    botCommands
      .filter((command) => !command.hidden)
      .map((command) => ({
        command: command.regExp.toString().replace(/\W+/g, ''), // converts regExp to string
        description: i18n[command.description][languageCode],
      })),
    languageCode === 'en'
      ? undefined
      : {
          language_code: languageCode,
        },
  );
});

bot.setWebHook(process.env.WEBAPP_URL);

router.post('/', async (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.on('callback_query', async (callback) => {
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

  // Target language selected callback
  if (data.targetLanguageCode !== undefined) {
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
  }

  if (data.page !== undefined) {
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
      await bot.editMessageText(
        i18n.t('chooseTargetLanguage', data.userLocale),
        {
          chat_id: message.chat.id,
          message_id: message.message_id,
          ...inlineButtonsBuilder.buildLanguageCodeReplyOptions(
            languages,
            'targetLanguageCode',
            data.userLocale,
            previousPage,
            nextPage,
          ),
        },
      );
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
  }

  if (data.translationAction !== undefined) {
    if (data.translationAction === translationActionListen) {
      let audioUrl = '';

      try {
        audioUrl = googleTTS.getAudioUrl(message.text, {
          lang: data.audioLanguageCode,
          slow: false,
          host: 'https://translate.google.com',
        });

        await downloadAudioFile(audioUrl, message.text);

        await bot.sendAudio(
          message.chat.id,
          fs.createReadStream(`${voiceoverDir}/${message.text}`),
          {
            caption: message.text,
            performer: 't.me/ProTranslatorBot',
            title: message.text,
          },
          { filename: message.text, contentType: 'audio/mpeg' },
        );

        removeAudioFile(message.text);

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

        if (transaction !== undefined) {
          transaction.finish();
        }
      }
    }

    // TODO: add more actions?
  }

  if (transaction !== undefined) {
    transaction.finish();
  }
});

bot.on('message', async (message) => {
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
          translationAction: translationActionListen,
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
});

module.exports = router;
