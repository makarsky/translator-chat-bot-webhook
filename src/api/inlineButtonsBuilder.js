const maxNumberOfInlineButtons = 8;

const buildLanguageCodeReplyOptions = (
  languageCodes,
  callbackParameter,
  userLocale,
  previosPage = undefined,
  nextPage = undefined,
) => {
  const buttons = languageCodes.map((code) => ({
    text: code,
    callback_data: JSON.stringify({
      [callbackParameter]: code,
      userLocale,
    }),
  }));

  // https://core.telegram.org/bots#pressing-buttons
  if (nextPage !== undefined) {
    buttons.push({
      text: '➡️',
      callback_data: JSON.stringify({
        page: nextPage,
        parameter: callbackParameter,
        userLocale,
      }),
    });
  }
  if (previosPage !== undefined) {
    buttons.unshift({
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
      inline_keyboard: [buttons],
    },
  };
};

module.exports = { buildLanguageCodeReplyOptions };
module.exports.maxNumberOfInlineButtons = maxNumberOfInlineButtons;
