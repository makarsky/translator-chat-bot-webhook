import type { Api } from 'grammy';
import type { ReadStream } from 'node:fs';

export interface TelegramMessage {
  chat: { id: number };
  from: { id: number; language_code?: string };
  message_id: number;
  text?: string;
}

export interface TelegramCommandMessage extends TelegramMessage {
  text: string;
}

export type TelegramCallbackMessage = TelegramCommandMessage;

export interface TelegramCallbackQuery {
  data?: string;
  message?: TelegramCallbackMessage;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  [key: string]: unknown;
}

export interface TelegramCallbackData {
  targetLanguageCode?: string;
  userLocale?: string;
  page?: number;
  translationAction?: string;
  audioLanguageCode?: string;
}

export interface TelegramLanguageOption {
  code: string;
  language: string;
}

export interface TelegramBotClient {
  sendMessage(
    chatId: number,
    text: string,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
  sendSticker(chatId: number, sticker: string): Promise<unknown>;
  editMessageText(
    text: string,
    options: { chat_id: number; message_id: number; [key: string]: unknown },
  ): Promise<unknown>;
  sendAudio(
    chatId: number,
    audio: ReadStream,
    options: Record<string, unknown>,
    fileOptions?: { filename?: string; contentType?: string },
  ): Promise<unknown>;
  setMyCommands(
    commands: Array<{ command: string; description: string }>,
    options?: { language_code: string },
  ): Promise<unknown>;
}

export interface TelegramCommand {
  regExp: RegExp;
  description: string;
  hidden: boolean;
  handler(
    this: TelegramBotClient,
    message: TelegramCommandMessage,
  ): Promise<void>;
}

export type TelegramApi = Api;
