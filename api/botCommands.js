const redisClient = require('./redisClient');
const inlineButtonsBuilder = require('./inlineButtonsBuilder');
const chooseTheTargetLanguageText = 'Choose the target language:'; // TODO: replace with translations

const botCommands = [
    {
        regExp: /\/set_language/,
        description: 'Set target language',
        handler: async function (message, match) {
            const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
            const lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');
            this.sendMessage(message.chat.id, chooseTheTargetLanguageText, inlineButtonsBuilder.buildLanguageCodeReplyOptions(lastUsedLanguageCodes.length > 0 ? lastUsedLanguageCodes : undefined));
        },
    },
    {
        regExp: /\/about/,
        description: 'About',
        handler: function (message, match) {
            const url = 'https://github.com/makarsky/translator-chat-bot-webhook'
            // https://core.telegram.org/bots/api#formatting-options
            const text = `[Repository](${url})\n\n[Suggestions / Bug Report](${url}/issues/new)\n\nMade with 🛠️ by Igor Makarsky`;

            this.sendMessage(message.chat.id, text, { parse_mode: 'MarkdownV2' });
        },
    },
];

module.exports = botCommands;
