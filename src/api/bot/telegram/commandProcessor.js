const Sentry = require('@sentry/node');
const botCommands = require('./botCommands');
const i18n = require('../../../localization/i18n');

const process = (bot) => {
  botCommands.forEach((command) =>
    bot.onText(command.regExp, (message, match) => {
      Sentry.setUser({ id: message.chat.id });

      const transaction = Sentry.startTransaction({
        op: command.regExp.toString().replace(/\W+/g, ''),
        name: command.regExp.toString().replace(/\W+/g, ''),
      });

      try {
        command.handler.bind(bot)(message, match);
      } finally {
        if (transaction !== undefined) {
          transaction.finish();
        }
      }
    }),
  );
};

const setCommandMenu = (bot) => {
  Object.keys(i18n.about).forEach((languageCode) => {
    bot.setMyCommands(
      botCommands
        .filter((command) => !command.hidden)
        .map((command) => ({
          command: command.regExp.toString().replace(/\W+/g, ''), // converts regExp to string
          description: i18n[command.description][languageCode],
        })),
      languageCode === 'en'
        ? undefined
        : {
            language_code: languageCode,
          },
    );
  });
};

module.exports = { process, setCommandMenu };
