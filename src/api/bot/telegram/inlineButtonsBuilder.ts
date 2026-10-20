const maxNumberOfInlineButtons = 8;
import type { TelegramLanguageOption } from './types.js';

const buildLanguageCodeReplyOptions = (
  languages: TelegramLanguageOption[],
  callbackParameter: string,
  userLocale: string | undefined,
  previosPage?: number,
  nextPage?: number,
) => {
  const buttons = languages.map((language) => ({
    text: language.language,
    callback_data: JSON.stringify({
      [callbackParameter]: language.code,
      userLocale,
    }),
  }));

  const pagination: { text: string; callback_data: string }[] = [];

  // https://core.telegram.org/bots#pressing-buttons
  if (nextPage !== undefined) {
    pagination.push({
      text: '➡️',
      callback_data: JSON.stringify({
        page: nextPage,
        parameter: callbackParameter,
        userLocale,
      }),
    });
  }
  if (previosPage !== undefined) {
    pagination.unshift({
      text: '⬅️',
      callback_data: JSON.stringify({
        page: previosPage,
        parameter: callbackParameter,
        userLocale,
      }),
    });
  }

  return {
    reply_markup: {
      inline_keyboard: [...buttons.map((b) => [b]), pagination],
    },
  };
};

export default { buildLanguageCodeReplyOptions, maxNumberOfInlineButtons };
