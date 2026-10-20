import { languages as mappedLanguages } from 'google-translate-api-x';
import path from 'node:path';
import * as Sentry from '@sentry/node';
import googleTTS from 'google-tts-api';
import inlineButtonsBuilder from './inlineButtonsBuilder.js';
import googleAnalytics from '../../../analytics/google-ga4.js';
import i18n from '../../../localization/i18n.js';
import availableLanguages from '../../availableLanguages.js';
import tursoClient from '../../tursoClient.js';
import voiceoverService from '../../voiceoverService.js';
import filterDuplicatesCallback from '../../../common/helper/filterDuplicatesCallback.js';
import translationActions from './translationActions.js';
import type {
  TelegramBotClient,
  TelegramCallbackData,
  TelegramCallbackMessage,
  TelegramCallbackQuery,
} from './types.js';

const mappedLanguagesByCode = mappedLanguages as Record<string, string>;

const processTargetLanguageCodeCallbackQuery = async (
  bot: TelegramBotClient,
  data: TelegramCallbackData & { targetLanguageCode: string },
  message: TelegramCallbackMessage,
) => {
  const chatSettings = await tursoClient.getChatSettingsById(message.chat.id);
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

  await tursoClient.setChatSettingsById(message.chat.id, chatSettings);

  const targetLanguage = mappedLanguagesByCode[data.targetLanguageCode];

  await googleAnalytics.event(
    message.from.id,
    googleAnalytics.actions.targetLanguageSelected,
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

const processPageCallbackQuery = async (
  bot: TelegramBotClient,
  data: TelegramCallbackData & { page: number },
  message: TelegramCallbackMessage,
) => {
  const itemsPerPage = inlineButtonsBuilder.maxNumberOfInlineButtons - 2;
  const pageCount = Math.ceil(availableLanguages.length / itemsPerPage);
  const offset = data.page * itemsPerPage;
  let languages = availableLanguages.slice(offset, offset + itemsPerPage);
  let previousPage;
  let nextPage;

  const chatSettings = await tursoClient.getChatSettingsById(message.chat.id);
  const lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];

  if (data.page === -1) {
    languages = lastUsedLanguageCodes
      .slice(0, inlineButtonsBuilder.maxNumberOfInlineButtons - 1)
      .map((code: string) => ({
        code,
        language: mappedLanguagesByCode[code],
      }));
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

const processTranslationActionCallbackQuery = async (
  bot: TelegramBotClient,
  data: TelegramCallbackData & {
    translationAction: string;
    audioLanguageCode?: string;
  },
  message: TelegramCallbackMessage,
) => {
  if (data.translationAction === translationActions.voiceover) {
    let filePath;

    try {
      const audioUrl = googleTTS.getAudioUrl(message.text, {
        lang: data.audioLanguageCode as string,
        slow: false,
        host: 'https://translate.google.com',
      });

      filePath = await voiceoverService.downloadAudioFile(
        audioUrl,
        message.text,
      );

      await bot.sendAudio(
        message.chat.id,
        voiceoverService.getVoiceoverStream(filePath),
        {
          caption: message.text,
          performer: 't.me/ProTranslatorBot',
          title: message.text,
        },
        { filename: path.basename(filePath), contentType: 'audio/mpeg' },
      );

      await googleAnalytics.event(
        message.from.id,
        googleAnalytics.actions.listen,
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
    } catch (error) {
      Sentry.captureException(error, {
        contexts: {
          audioUrlError: {
            chatId: message.chat.id,
            audioLanguageCode: data.audioLanguageCode,
          },
        },
      });
      throw error;
    } finally {
      if (filePath) {
        await voiceoverService.removeAudioFile(filePath);
      }
    }
  }

  // TODO: add more actions (slow voiceover, picture)?
};

const process = async (
  callback: TelegramCallbackQuery,
  bot: TelegramBotClient,
) => {
  if (!callback.data || !callback.message) {
    return;
  }

  // Warning! There is no message.from.language_code in the callback_query.
  // Use callback.data.userLocale instead.
  const { message } = callback;

  Sentry.setUser({ id: message.chat.id });

  await Sentry.startSpan(
    { op: 'callback_query', name: 'callback_query' },
    async () => {
      const data = JSON.parse(callback.data!) as TelegramCallbackData;

      // A new target language is selected.
      if (data.targetLanguageCode !== undefined) {
        await processTargetLanguageCodeCallbackQuery(
          bot,
          {
            ...data,
            targetLanguageCode: data.targetLanguageCode,
          },
          message,
        );
      }

      // A new target language page is selected.
      if (data.page !== undefined) {
        await processPageCallbackQuery(
          bot,
          { ...data, page: data.page },
          message,
        );
      }

      // A translated text action is selected.
      if (data.translationAction !== undefined) {
        await processTranslationActionCallbackQuery(
          bot,
          {
            ...data,
            translationAction: data.translationAction,
          },
          message,
        );
      }
    },
  );
};

export default { process };
