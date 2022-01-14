const maxNumberOfInlineButtons = 8;

const buildLanguageCodeReplyOptions = (
  languageCodes,
  callbackParameter = 'targetLanguageCode',
  previosPage,
  nextPage,
) => {
  const buttons = languageCodes.map((code) => ({
    text: code,
    callback_data: JSON.stringify({ [callbackParameter]: code }),
  }));

  // https://core.telegram.org/bots#pressing-buttons
  if (nextPage !== undefined) {
    buttons.push({
      text: '➡️',
      callback_data: JSON.stringify({
        page: nextPage,
        parameter: callbackParameter,
      }),
    });
  }
  if (previosPage !== undefined) {
    buttons.unshift({
      text: '⬅️',
      callback_data: JSON.stringify({
        page: previosPage,
        parameter: callbackParameter,
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
