const maxNumberOfInlineButtons = 8;

const buildLanguageCodeReplyOptions = (lastUsedLanguageCodes) => {
    const buttons = (lastUsedLanguageCodes || availableLanguages.map((l) => l.code))
        .slice(0, maxNumberOfInlineButtons - (lastUsedLanguageCodes ? 1 : 2))
        .map((code) => ({
            text: code,
            callback_data: JSON.stringify({ targetLanguageCode: code }),
        }));

    // https://core.telegram.org/bots#pressing-buttons
    buttons.push({
        text: '➡️',
        callback_data: JSON.stringify({ page: lastUsedLanguageCodes ? 0 : 1 }),
    });

    return {
        reply_markup: {
            inline_keyboard: [buttons],
        },
    };
};

module.exports = { buildLanguageCodeReplyOptions };
module.exports.maxNumberOfInlineButtons = maxNumberOfInlineButtons;
