import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVoiceoverActionButton,
  isCommandMessage,
  pickSticker,
  selectTargetLanguage,
  updateRecentLanguageCodes,
} from '../src/api/bot/telegram/messagePolicy.js';

test('selectTargetLanguage requests a target when there is no history', () => {
  assert.deepEqual(selectTargetLanguage([]), {
    kind: 'prompt',
    reason: 'missing',
  });
});

test('selectTargetLanguage uses the preferred language before source detection', () => {
  assert.deepEqual(selectTargetLanguage(['fr', 'en']), {
    kind: 'translate',
    targetLanguageCode: 'fr',
  });
});

test('selectTargetLanguage falls back when the preferred language matches the source', () => {
  assert.deepEqual(selectTargetLanguage(['fr', 'en'], 'fr'), {
    kind: 'translate',
    targetLanguageCode: 'en',
  });
});

test('selectTargetLanguage requests a new target when the only preference matches the source', () => {
  assert.deepEqual(selectTargetLanguage(['fr'], 'fr'), {
    kind: 'prompt',
    reason: 'unsuitable',
  });
});

test('updateRecentLanguageCodes puts target and source first, removes duplicates, and limits the result', () => {
  const previousCodes = ['de', 'fr', 'es'];

  assert.deepEqual(
    updateRecentLanguageCodes(previousCodes, 'fr', 'en', 3),
    ['fr', 'en', 'de'],
  );
  assert.deepEqual(previousCodes, ['de', 'fr', 'es']);
});

test('buildVoiceoverActionButton includes callback data below the text limit', () => {
  assert.deepEqual(
    buildVoiceoverActionButton('bonjour', 'fr-FR', 'Listen', 'voiceover'),
    {
      text: 'Listen',
      callback_data: JSON.stringify({
        translationAction: 'voiceover',
        audioLanguageCode: 'fr-FR',
      }),
    },
  );
});

test('buildVoiceoverActionButton omits unsupported or 200-character translations', () => {
  assert.equal(
    buildVoiceoverActionButton('short text', null, 'Listen', 'voiceover'),
    null,
  );
  assert.equal(
    buildVoiceoverActionButton('a'.repeat(200), 'en-US', 'Listen', 'voiceover'),
    null,
  );
});

test('isCommandMessage only matches defined command regexes', () => {
  const commands = [{ regExp: /^\/start$/ }, { regExp: /^\/help$/ }];

  assert.equal(isCommandMessage('/start', commands), true);
  assert.equal(isCommandMessage('hello /start', commands), false);
  assert.equal(isCommandMessage('hello', commands), false);
});

test('pickSticker chooses the item at the random index and handles empty lists safely', () => {
  assert.equal(pickSticker(['a', 'b', 'c'], 1), 'b');
  assert.equal(pickSticker([], 0), undefined);
});