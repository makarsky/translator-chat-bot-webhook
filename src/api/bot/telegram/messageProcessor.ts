import { translate } from 'google-translate-api-x';
import * as Sentry from '@sentry/node';
import tursoClient from '../../tursoClient.js';
import availableLanguages from '../../availableLanguages.js';
import googleTextToSpeechLanguages from '../../googleTextToSpeechLanguages.js';
import googleAnalytics from '../../../analytics/google-ga4.js';
import inlineButtonsBuilder from './inlineButtonsBuilder.js';
import botCommands from './botCommands.js';
import i18n from '../../../localization/i18n.js';
import translationActions from './translationActions.js';
import {
  buildVoiceoverActionButton,
  isCommandMessage,
  pickSticker,
  selectTargetLanguage,
  updateRecentLanguageCodes,
} from './messagePolicy.js';
import type { TelegramBotClient, TelegramMessage } from './types.js';

const animulzStickers = [
  'CAACAgEAAxkBAAIG8WHoMt88uW2Hoqt45qJ62WwZJNpvAAJ6EAACmX-IAqU-3GtbhUNmIwQ',
  'CAACAgEAAxkBAAIGy2HoLwq3HGMXq3_U7-aekcwx2SzIAAJ2DwACmX-IAu5NP0uH4Y2nIwQ',
  'CAACAgEAAxkBAAIGzGHoLyw5Kzy9XxND2_mWGwGBpP-KAAI7FAACmX-IArz-u6pndvuMIwQ',
];

const process = async (message: TelegramMessage, bot: TelegramBotClient) => {
  const messageText = message.text;
  if (messageText === undefined) {
    const sticker = pickSticker(
      animulzStickers,
      Math.floor(Math.random() * animulzStickers.length),
    );

    if (sticker) {
      await bot.sendSticker(message.chat.id, sticker);
    }
    return;
  }

  if (isCommandMessage(messageText, botCommands)) {
    return;
  }

  Sentry.setUser({ id: message.chat.id });

  const sendTargetLanguagePrompt = async (
    reason: 'missing' | 'unsuitable',
  ) => {
    await bot.sendMessage(
      message.chat.id,
      i18n.t(
        reason === 'missing'
          ? 'chooseTargetLanguage'
          : 'unsuitableTargetLanguage',
        message.from.language_code,
      ),
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

  let lastUsedLanguageCodes: string[] = [];
  try {
    await Sentry.startSpan({ op: 'message', name: 'message' }, async () => {
      const chatSettings = await tursoClient.getChatSettingsById(
        message.chat.id,
      );
      lastUsedLanguageCodes = chatSettings.lastUsedLanguageCodes || [];

      let targetLanguageSelection =
        selectTargetLanguage(lastUsedLanguageCodes);

      if (targetLanguageSelection.kind === 'prompt') {
        await sendTargetLanguagePrompt(targetLanguageSelection.reason);
        return;
      }

      let targetLanguageCode = targetLanguageSelection.targetLanguageCode;
      let translation = await translate(messageText, {
        to: targetLanguageCode,
      });

      targetLanguageSelection = selectTargetLanguage(
        lastUsedLanguageCodes,
        translation.from.language.iso,
      );

      if (targetLanguageSelection.kind === 'prompt') {
        await sendTargetLanguagePrompt(targetLanguageSelection.reason);
        return;
      }

      if (targetLanguageSelection.targetLanguageCode !== targetLanguageCode) {
        targetLanguageCode = targetLanguageSelection.targetLanguageCode;
        translation = await translate(messageText, { to: targetLanguageCode });
      }

      lastUsedLanguageCodes = updateRecentLanguageCodes(
        lastUsedLanguageCodes,
        targetLanguageCode,
        translation.from.language.iso,
        inlineButtonsBuilder.maxNumberOfInlineButtons - 1,
      );
      chatSettings.lastUsedLanguageCodes = lastUsedLanguageCodes;
      chatSettings.updatedAtTimestamp = Date.now();
      await tursoClient.setChatSettingsById(message.chat.id, chatSettings);

      const audioLanguageCode =
        googleTextToSpeechLanguages.findByCode(targetLanguageCode);
      const voiceoverActionButton = buildVoiceoverActionButton(
        translation.text,
        audioLanguageCode,
        i18n.t('listen', message.from.language_code),
        translationActions.voiceover,
      );

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
        voiceoverActionButton
          ? {
              reply_markup: {
                inline_keyboard: [[voiceoverActionButton]],
              },
            }
          : {},
      );

      await googleAnalytics.event(
        message.from.id,
        googleAnalytics.actions.translate,
        targetLanguageCode,
      );
    });
  } catch (error) {
    console.error('onMessage handler error', error);
    Sentry.captureException(error, {
      contexts: {
        onMessageError: {
          chatId: message.chat.id,
          lastUsedLanguageCodes,
        },
      },
    });
    throw error;
  }
};

export default { process };
