import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTargetLanguageMenu,
  findCommandMatch,
  getCommandName,
} from '../src/api/bot/telegram/commandPolicy.js';

test('findCommandMatch returns the first command whose regex matches the text', () => {
  const commands = [
    { regExp: /^\/about$/, description: 'about', hidden: false },
    { regExp: /^\/start(?:\s+\w+)?$/, description: 'start', hidden: true },
  ];

  assert.deepEqual(findCommandMatch(commands, '/start bot'), commands[1]);
  assert.equal(findCommandMatch(commands, '/help'), undefined);
});

test('getCommandName normalizes the regex into a stable command identifier', () => {
  assert.equal(getCommandName(/^\/start(?:\s+\w+)?$/), 'start');
});

test('buildTargetLanguageMenu prefers recent languages and falls back to the global list', () => {
  const result = buildTargetLanguageMenu({
    lastUsedLanguageCodes: ['fr', 'en'],
    availableLanguages: [
      { code: 'fr', language: 'French' },
      { code: 'en', language: 'English' },
      { code: 'de', language: 'German' },
      { code: 'es', language: 'Spanish' },
    ],
    mappedLanguagesByCode: {
      fr: 'French',
      en: 'English',
      de: 'German',
      es: 'Spanish',
    },
    maxLanguages: 3,
  });

  assert.deepEqual(result, [
    { code: 'fr', language: 'French' },
    { code: 'en', language: 'English' },
  ]);

  assert.deepEqual(
    buildTargetLanguageMenu({
      lastUsedLanguageCodes: [],
      availableLanguages: [
        { code: 'fr', language: 'French' },
        { code: 'en', language: 'English' },
      ],
      mappedLanguagesByCode: {
        fr: 'French',
        en: 'English',
      },
      maxLanguages: 3,
    }),
    [
      { code: 'fr', language: 'French' },
      { code: 'en', language: 'English' },
    ],
  );
});
