const Sentry = require('@sentry/node');
const botCommands = require('./botCommands');
const i18n = require('../../../localization/i18n');

const process = async (bot, message) => {
  if (typeof message.text !== 'string') {
    return false;
  }

  const command = botCommands.find((item) => item.regExp.test(message.text));

  if (!command) {
    return false;
  }

  Sentry.setUser({ id: message.chat.id });

  const commandName = command.regExp.toString().replace(/\W+/g, '');
  await Sentry.startSpan({ op: commandName, name: commandName }, async () =>
    command.handler.call(bot, message, message.text.match(command.regExp)),
  );

  return true;
};

const setCommandMenu = async (bot) =>
  Promise.all(
    Object.keys(i18n.about).map((languageCode) =>
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
      ),
    ),
  );

module.exports = { process, setCommandMenu };
