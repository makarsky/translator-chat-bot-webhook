export type TargetLanguageSelection =
  | { kind: 'prompt'; reason: 'missing' | 'unsuitable' }
  | { kind: 'translate'; targetLanguageCode: string };

export const selectTargetLanguage = (
  lastUsedLanguageCodes: readonly string[],
  detectedSourceLanguageCode?: string,
): TargetLanguageSelection => {
  if (lastUsedLanguageCodes.length === 0) {
    return { kind: 'prompt', reason: 'missing' };
  }

  const preferredLanguageCode = lastUsedLanguageCodes[0];

  if (detectedSourceLanguageCode !== preferredLanguageCode) {
    return {
      kind: 'translate',
      targetLanguageCode: preferredLanguageCode,
    };
  }

  const fallbackLanguageCode = lastUsedLanguageCodes[1];

  if (fallbackLanguageCode === undefined) {
    return { kind: 'prompt', reason: 'unsuitable' };
  }

  return {
    kind: 'translate',
    targetLanguageCode: fallbackLanguageCode,
  };
};

export const updateRecentLanguageCodes = (
  lastUsedLanguageCodes: readonly string[],
  targetLanguageCode: string,
  sourceLanguageCode: string,
  maxLanguages: number,
): string[] =>
  [targetLanguageCode, sourceLanguageCode, ...lastUsedLanguageCodes]
    .filter((code, index, codes) => codes.indexOf(code) === index)
    .slice(0, maxLanguages);

export const buildVoiceoverActionButton = (
  translationText: string,
  audioLanguageCode: string | null,
  label: string,
  translationAction: string,
): { text: string; callback_data: string } | null => {
  if (translationText.length >= 200 || !audioLanguageCode) {
    return null;
  }

  return {
    text: label,
    callback_data: JSON.stringify({
      translationAction,
      audioLanguageCode,
    }),
  };
};

export const isCommandMessage = (
  messageText: string,
  commands: ReadonlyArray<{ regExp: RegExp }>,
): boolean =>
  commands.some((command) => messageText.match(command.regExp) !== null);

export const pickSticker = (
  stickers: readonly string[],
  index: number,
): string | undefined => {
  if (stickers.length === 0) {
    return undefined;
  }

  return stickers[index % stickers.length];
};