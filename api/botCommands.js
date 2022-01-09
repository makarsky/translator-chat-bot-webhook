const redisClient = require('./redisClient');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const i18n = require('../localization/i18n');

const botCommands = [
    {
        regExp: /\/set_language/,
        description: 'Set target language',
        handler: async function (message, match) {
            const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
            const lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');
            this.sendMessage(
                message.chat.id,
                i18n.t('chooseTargetLanguage', 'en'),
                inlineButtonsBuilder.buildLanguageCodeReplyOptions(
                    lastUsedLanguageCodes.length > 0 ? lastUsedLanguageCodes : undefined
                )
            );
        },
    },
    {
        regExp: /\/about/,
        description: 'About',
        handler: function (message, match) {
            // https://core.telegram.org/bots/api#formatting-options
            this.sendMessage(
                message.chat.id,
                i18n.t(
                    'about',
                    'en',
                    ['https://github.com/makarsky/translator-chat-bot-webhook']
                ),
                { parse_mode: 'MarkdownV2' }
            );
        },
    },
];

module.exports = botCommands;
