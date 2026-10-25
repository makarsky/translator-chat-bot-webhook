import { Api, InputFile } from 'grammy';
import type { TelegramBotClient } from './types.js';

export const createTelegramClient = (api: Api): TelegramBotClient => ({
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
});

export default { createTelegramClient };
