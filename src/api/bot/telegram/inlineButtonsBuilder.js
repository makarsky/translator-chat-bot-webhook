const maxNumberOfInlineButtons = 8;

const buildLanguageCodeReplyOptions = (
  languages,
  callbackParameter,
  userLocale,
  previosPage = undefined,
  nextPage = undefined,
) => {
  const buttons = languages.map((language) => ({
    text: language.language,
    callback_data: JSON.stringify({
      [callbackParameter]: language.code,
      userLocale,
    }),
  }));

  const pagination = [];

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

module.exports = { buildLanguageCodeReplyOptions };
module.exports.maxNumberOfInlineButtons = maxNumberOfInlineButtons;
