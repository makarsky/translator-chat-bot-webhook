import { Api, InputFile } from 'grammy';
import type { TelegramBotClient, TelegramUpdate } from './types';
const dispatchUpdate = require('./updateDispatcher');

let telegram: { api: Api; client: TelegramBotClient } | undefined;

const getTelegram = () => {
  if (!process.env.TOKEN) {
    throw new Error('TOKEN environment variable is required');
  }

  if (!telegram) {
    const api = new Api(process.env.TOKEN);
    const client: TelegramBotClient = {
      sendMessage: (chatId, text, options) =>
        api.sendMessage(
          chatId,
          text,
          options as Parameters<Api['sendMessage']>[2],
        ),
      sendSticker: (chatId, sticker) => api.sendSticker(chatId, sticker),
      editMessageText: (text, options) => {
        const { chat_id: chatId, message_id: messageId, ...other } = options;
        return api.editMessageText(
          chatId,
          messageId,
          text,
          other as Parameters<Api['editMessageText']>[3],
        );
      },
      sendAudio: (chatId, audio, options, fileOptions = {}) =>
        api.sendAudio(
          chatId,
          new InputFile(audio, fileOptions.filename),
          options as Parameters<Api['sendAudio']>[2],
        ),
      setMyCommands: (commands, options) =>
        api.setMyCommands(
          commands,
          options as Parameters<Api['setMyCommands']>[1],
        ),
    };

    telegram = { api, client };
  }

  return telegram;
};

const processUpdate = (update: TelegramUpdate) =>
  dispatchUpdate(update, getTelegram().client);

module.exports = { getTelegram, processUpdate };
