import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommandMenu } from '../src/api/bot/telegram/commandMenuPolicy.js';

test('buildCommandMenu keeps only visible commands and preserves their resolved descriptions', () => {
  assert.deepEqual(
    buildCommandMenu([
      { command: 'start', description: 'Start translation', hidden: true },
      { command: 'about', description: 'About this bot' },
      { command: 'set_target_language', description: 'Choose language' },
    ]),
    [
      { command: 'about', description: 'About this bot' },
      { command: 'set_target_language', description: 'Choose language' },
    ],
  );
});
