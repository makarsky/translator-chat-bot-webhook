const redisClient = require('./redisClient');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const i18n = require('../localization/i18n');
const availableLanguages = require('./availableLanguages');

const botCommands = [
    {
        regExp: /\/set_language/,
        description: 'Set target language',
        handler: async function (message, match) {
            const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
            const lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');
            const languageCodes = lastUsedLanguageCodes.length > 0
                ? lastUsedLanguageCodes.slice(0, inlineButtonsBuilder.maxNumberOfInlineButtons - 1)
                : availableLanguages.map((l) => l.code).slice(0, inlineButtonsBuilder.maxNumberOfInlineButtons - 2);

            this.sendMessage(
                message.chat.id,
                i18n.t('chooseTargetLanguage', chatSettings.interfaceLanguageCode),
                inlineButtonsBuilder.buildLanguageCodeReplyOptions(
                    languageCodes,
                    'targetLanguageCode',
                    undefined,
                    lastUsedLanguageCodes.length > 0 ? 0 : 1
                )
            );
        },
    },
    {
        regExp: /\/about/,
        description: 'About',
        handler: async function (message, match) {
            const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
            // https://core.telegram.org/bots/api#formatting-options
            this.sendMessage(
                message.chat.id,
                i18n.t(
                    'about',
                    chatSettings.interfaceLanguageCode,
                    ['https://github.com/makarsky/translator-chat-bot-webhook']
                ),
                { parse_mode: 'MarkdownV2' }
            );
        },
    },
    {
        regExp: /\/set_interface_language/,
        description: 'Set interface language',
        handler: async function (message, match) {
            const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
            this.sendMessage(
                message.chat.id,
                i18n.t('chooseInterfaceLanguage', chatSettings.interfaceLanguageCode),
                inlineButtonsBuilder.buildLanguageCodeReplyOptions(
                    Object.keys(i18n.chooseTargetLanguage),
                    'interfaceLanguageCode',
                    undefined,
                    1
                )
            );
        },
    },
];

module.exports = botCommands;
