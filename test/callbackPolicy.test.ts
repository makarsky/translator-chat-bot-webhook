import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  appendLanguageSelection,
  buildPageState,
} from '../src/api/bot/telegram/callbackPolicy.js';

test('appendLanguageSelection adds a chosen language to the front and deduplicates', () => {
  assert.deepEqual(appendLanguageSelection(['fr', 'en'], 'en', 4), [
    'en',
    'fr',
  ]);
});

test('buildPageState returns a recent-language page and next-page marker for the recent list', () => {
  const result = buildPageState({
    page: -1,
    availableLanguages: [
      { code: 'fr', language: 'French' },
      { code: 'en', language: 'English' },
      { code: 'de', language: 'German' },
    ],
    lastUsedLanguageCodes: ['fr', 'en', 'de'],
    mappedLanguagesByCode: {
      fr: 'French',
      en: 'English',
      de: 'German',
    },
    itemsPerPage: 2,
    maxLanguages: 7,
  });

  assert.deepEqual(result.languages, [
    { code: 'fr', language: 'French' },
    { code: 'en', language: 'English' },
    { code: 'de', language: 'German' },
  ]);
  assert.equal(result.previousPage, undefined);
  assert.equal(result.nextPage, 0);
});

test('buildPageState returns the first page navigation markers for the list view', () => {
  const result = buildPageState({
    page: 0,
    availableLanguages: [
      { code: 'fr', language: 'French' },
      { code: 'en', language: 'English' },
      { code: 'de', language: 'German' },
      { code: 'es', language: 'Spanish' },
      { code: 'it', language: 'Italian' },
    ],
    lastUsedLanguageCodes: ['fr'],
    mappedLanguagesByCode: {
      fr: 'French',
      en: 'English',
      de: 'German',
      es: 'Spanish',
      it: 'Italian',
    },
    itemsPerPage: 2,
    maxLanguages: 3,
  });

  assert.deepEqual(result.languages, [
    { code: 'fr', language: 'French' },
    { code: 'en', language: 'English' },
  ]);
  assert.equal(result.previousPage, -1);
  assert.equal(result.nextPage, 1);
});
