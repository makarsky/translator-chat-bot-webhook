import type { TelegramLanguageOption } from './types.js';

export interface BuildPageStateInput {
  page: number;
  availableLanguages: TelegramLanguageOption[];
  lastUsedLanguageCodes: readonly string[];
  mappedLanguagesByCode: Record<string, string>;
  itemsPerPage: number;
  maxLanguages: number;
}

export const appendLanguageSelection = (
  lastUsedLanguageCodes: readonly string[],
  selectedLanguageCode: string,
  maxLanguages: number,
): string[] =>
  [selectedLanguageCode, ...lastUsedLanguageCodes]
    .filter((code, index, codes) => codes.indexOf(code) === index)
    .slice(0, maxLanguages);

export const buildPageState = ({
  page,
  availableLanguages,
  lastUsedLanguageCodes,
  mappedLanguagesByCode,
  itemsPerPage,
  maxLanguages,
}: BuildPageStateInput) => {
  const pageCount = Math.ceil(availableLanguages.length / itemsPerPage);
  const offset = page * itemsPerPage;
  let languages = availableLanguages.slice(offset, offset + itemsPerPage);
  let previousPage: number | undefined;
  let nextPage: number | undefined;

  if (page === -1) {
    languages = lastUsedLanguageCodes
      .slice(0, maxLanguages)
      .map((code) => ({
        code,
        language: mappedLanguagesByCode[code],
      }));
    nextPage = 0;
  } else if (page === 0) {
    nextPage = page + 1;

    if (lastUsedLanguageCodes.length > 0) {
      previousPage = page - 1;
    }
  } else if (page + 1 === pageCount) {
    previousPage = page - 1;
  } else {
    nextPage = page + 1;
    previousPage = page - 1;
  }

  return { languages, previousPage, nextPage };
};
