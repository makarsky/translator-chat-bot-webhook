export interface ChatSettings extends Record<string, unknown> {
  lastUsedLanguageCodes?: string[];
  source?: string;
  updatedAtTimestamp?: number;
}

export const parseChatSettings = (settingsValue: unknown): ChatSettings => {
  if (typeof settingsValue !== 'string') {
    return {};
  }

  try {
    const parsed = JSON.parse(settingsValue);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as ChatSettings)
      : {};
  } catch {
    return {};
  }
};

export const buildChatSettingsUpsert = (
  chatId: number | string,
  settings: ChatSettings,
) => ({
  sql: `INSERT INTO chat_settings (chat_id, settings)
        VALUES (?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET settings = excluded.settings`,
  args: [String(chatId), JSON.stringify(settings)],
});
