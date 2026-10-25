import type { TelegramLanguageOption } from './types.js';

export interface CommandDefinition {
  regExp: RegExp;
  description: string;
  hidden: boolean;
}

export interface BuildTargetLanguageMenuInput {
  lastUsedLanguageCodes: readonly string[];
  availableLanguages: TelegramLanguageOption[];
  mappedLanguagesByCode: Record<string, string>;
  maxLanguages: number;
}

export const findCommandMatch = <T extends { regExp: RegExp }>(
  commands: readonly T[],
  messageText: string,
): T | undefined => commands.find((item) => item.regExp.test(messageText));

export const getCommandName = (regExp: RegExp): string => {
  const match = regExp.toString().match(/\/([A-Za-z0-9_]+)/);
  return match ? match[1] : '';
};

export const buildTargetLanguageMenu = ({
  lastUsedLanguageCodes,
  availableLanguages,
  mappedLanguagesByCode,
  maxLanguages,
}: BuildTargetLanguageMenuInput): TelegramLanguageOption[] => {
  if (lastUsedLanguageCodes.length > 0) {
    return lastUsedLanguageCodes
      .slice(0, maxLanguages)
      .flatMap((code) => {
        const language =
          mappedLanguagesByCode[code] ??
          availableLanguages.find((option) => option.code === code)?.language;

        return language ? [{ code, language }] : [];
      });
  }

  return availableLanguages.slice(0, maxLanguages);
};
