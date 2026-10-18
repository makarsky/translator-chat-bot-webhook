const commandProcessor = require('./commandProcessor');
const messageProcessor = require('./messageProcessor');
const callbackQueryProcessor = require('./callbackQueryProcessor');

const dispatchUpdate = async (
  update,
  bot,
  processors = {
    commandProcessor,
    messageProcessor,
    callbackQueryProcessor,
  },
) => {
  if (update.message) {
    const handled = await processors.commandProcessor.process(
      bot,
      update.message,
    );

    if (!handled) {
      await processors.messageProcessor.process(update.message, bot);
    }
    return;
  }

  if (update.callback_query) {
    await processors.callbackQueryProcessor.process(update.callback_query, bot);
  }
};

module.exports = dispatchUpdate;
