const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const translate = require('@vitalets/google-translate-api');
const codeLanguageMap = require('@vitalets/google-translate-api/languages');
const googleTTS = require('google-tts-api');
const Sentry = require('@sentry/node');
const redisClient = require('./redisClient');
const availableLanguages = require('./availableLanguages');
const googleTextToSpeechLanguages = require('./googleTextToSpeechLanguages');
const googleUa = require('../analytics/google-ua');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const botCommands = require('./botCommands');
const i18n = require('../localization/i18n');

const router = express.Router();

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

const maxTextToSpeechLength = 200;
const translationActionListen = 'listen';

const filterDuplicatesCallback = (v, i, a) => v && i === a.indexOf(v);

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
      transaction.finish();
    }
  }),
);

bot.setMyCommands(
  botCommands
    .filter((command) => !command.hidden)
    .map((command) => ({
      command: command.regExp.toString().replace(/\W+/g, ''), // converts regExp to string
      description: command.description,
    })),
);
bot.setWebHook(process.env.WEBAPP_URL);

router.post('/', async (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.on('callback_query', async (callback) => {
  if (!callback.data || !callback.message) {
    return;
  }

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

    await redisClient.setChatSettingsById(
      message.chat.id,
      '.lastUsedLanguageCodes',
      lastUsedLanguageCodes,
    );

    const targetLanguage = codeLanguageMap[data.targetLanguageCode];

    googleUa.event(
      message.from.id,
      googleUa.categories.translator,
      googleUa.actions.targetLanguageSelected,
      data.targetLanguageCode,
    );

    bot.editMessageText(
      i18n.t(
        'targetLanguageStatus',
        chatSettings.interfaceLanguageCode || message.from.language_code,
        [targetLanguage, data.targetLanguageCode],
      ),
      {
        chat_id: message.chat.id,
        message_id: message.message_id,
      },
    );
  }

  // Target language selected callback
  if (data.interfaceLanguageCode !== undefined) {
    await redisClient.setChatSettingsById(
      message.chat.id,
      '.interfaceLanguageCode',
      data.interfaceLanguageCode,
    );

    const interfaceLanguage = codeLanguageMap[data.interfaceLanguageCode];

    googleUa.event(
      message.from.id,
      googleUa.categories.translator,
      googleUa.actions.interfaceLanguageSelected,
      data.interfaceLanguageCode,
    );

    bot.editMessageText(
      i18n.t('interfaceLanguageStatus', data.interfaceLanguageCode, [
        interfaceLanguage,
        data.interfaceLanguageCode,
      ]),
      {
        chat_id: message.chat.id,
        message_id: message.message_id,
      },
    );
  }

  if (data.page !== undefined) {
    const itemsPerPage = inlineButtonsBuilder.maxNumberOfInlineButtons - 2;
    const pageCount = Math.ceil(availableLanguages.length / itemsPerPage);
    const offset = data.page * itemsPerPage;
    let languageCodes = availableLanguages
      .slice(offset, offset + itemsPerPage)
      .map((l) => l.code);

    let previousPage;
    let nextPage;

    const chatSettings = await redisClient.getChatSettingsById(message.chat.id);
    const lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];

    if (data.page === -1) {
      languageCodes = lastUsedLanguageCodes.slice(
        0,
        inlineButtonsBuilder.maxNumberOfInlineButtons - 1,
      );
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

    bot.editMessageText(
      i18n.t(
        'chooseTargetLanguage',
        chatSettings.interfaceLanguageCode || message.from.language_code,
      ),
      {
        chat_id: message.chat.id,
        message_id: message.message_id,
        ...inlineButtonsBuilder.buildLanguageCodeReplyOptions(
          languageCodes,
          'targetLanguageCode',
          previousPage,
          nextPage,
        ),
      },
    );
  }

  if (data.translationAction !== undefined) {
    if (data.translationAction === translationActionListen) {
      const chatSettings = await redisClient.getChatSettingsById(
        message.chat.id,
      );
      const lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];
      let audioUrl = '';

      try {
        audioUrl = googleTTS.getAudioUrl(message.text, {
          lang: googleTextToSpeechLanguages.findByCode(
            lastUsedLanguageCodes[0],
          ),
          slow: false,
          host: 'https://translate.google.com',
        });

        await bot.sendAudio(message.chat.id, audioUrl, {
          caption: message.text,
        });

        googleUa.event(
          message.from.id,
          googleUa.categories.translator,
          googleUa.actions.listen,
        );

        bot.editMessageText(message.text, {
          chat_id: message.chat.id,
          message_id: message.message_id,
        });
      } catch (e) {
        console.log(
          'audioUrl error',
          message.text,
          audioUrl,
          lastUsedLanguageCodes,
        );

        Sentry.captureException(e, {
          contexts: {
            audioUrlError: {
              chatId: message.chat.id,
              lastUsedLanguageCodes,
            },
          },
        });

        transaction.finish();
      }
    }

    // TODO: add more actions?
  }

  transaction.finish();
});

bot.on('message', async (message) => {
  if (botCommands.some((command) => message.text.match(command.regExp))) {
    return;
  }

  Sentry.setUser({ id: message.chat.id });

  const transaction = Sentry.startTransaction({
    op: 'message',
    name: 'message',
  });

  const requestTargetLanguage = (text) => {
    bot.sendMessage(
      message.chat.id,
      text,
      inlineButtonsBuilder.buildLanguageCodeReplyOptions(
        availableLanguages
          .map((l) => l.code)
          .slice(0, inlineButtonsBuilder.maxNumberOfInlineButtons - 2),
        'targetLanguageCode',
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
        i18n.t(
          'chooseTargetLanguage',
          chatSettings.interfaceLanguageCode || message.from.language_code,
        ),
      );
      return;
    }

    let targetLanguage = lastUsedLanguageCodes[0];
    let translation = await translate(message.text, { to: targetLanguage });

    if (translation.from.language.iso === lastUsedLanguageCodes[0]) {
      if (lastUsedLanguageCodes.length === 1) {
        requestTargetLanguage(
          i18n.t(
            'unsuitableTargetLanguage',
            chatSettings.interfaceLanguageCode || message.from.language_code,
          ),
        );
        return;
      }
      // eslint-disable-next-line prefer-destructuring
      targetLanguage = lastUsedLanguageCodes[1];
      translation = await translate(message.text, { to: targetLanguage });
    }

    lastUsedLanguageCodes.unshift(
      targetLanguage,
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

    if (
      translation.text.length < maxTextToSpeechLength &&
      googleTextToSpeechLanguages.findByCode(targetLanguage)
    ) {
      actionButtons.push({
        text: i18n.t(
          'listen',
          chatSettings.interfaceLanguageCode || message.from.language_code,
        ),
        callback_data: JSON.stringify({
          translationAction: translationActionListen,
        }),
      });
    }

    await bot.sendMessage(
      message.chat.id,
      `${
        translation.from.text.didYouMean
          ? `${translation.from.text.value}\n`
          : ''
      }${translation.text}`,
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
      targetLanguage,
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
    transaction.finish();
  }
});

module.exports = router;
