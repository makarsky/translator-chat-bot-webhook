const { Api, InputFile } = require('grammy');
const dispatchUpdate = require('./updateDispatcher');

let telegram;

const getTelegram = () => {
  if (!process.env.TOKEN) {
    throw new Error('TOKEN environment variable is required');
  }

  if (!telegram) {
    const api = new Api(process.env.TOKEN);
    const client = {
      sendMessage: (...args) => api.sendMessage(...args),
      sendSticker: (...args) => api.sendSticker(...args),
      editMessageText: (text, options) => {
        const { chat_id: chatId, message_id: messageId, ...other } = options;
        return api.editMessageText(chatId, messageId, text, other);
      },
      sendAudio: (chatId, audio, options, fileOptions = {}) =>
        api.sendAudio(
          chatId,
          new InputFile(audio, fileOptions.filename),
          options,
        ),
      setMyCommands: (...args) => api.setMyCommands(...args),
    };

    telegram = { api, client };
  }

  return telegram;
};

const processUpdate = (update) => dispatchUpdate(update, getTelegram().client);

module.exports = { getTelegram, processUpdate };
