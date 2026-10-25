import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildAudioFilePath, sanitizeVoiceoverText } from '../src/api/voiceoverFilePolicy.js';

test('sanitizeVoiceoverText removes unsafe path characters and reserved names', () => {
  assert.equal(sanitizeVoiceoverText('../CON: <audio>?*'), '_CON___audio___');
  assert.equal(sanitizeVoiceoverText('  .  '), '_._');
});

test('buildAudioFilePath keeps the file inside the target directory and trims to the byte cap', () => {
  const directory = path.join('tmp');
  const filePath = buildAudioFilePath(
    '你好'.repeat(300),
    directory,
    '00000000-0000-0000-0000-000000000001',
  );
  const fileName = path.basename(filePath);

  assert.equal(path.dirname(filePath), directory);
  assert.ok(Buffer.byteLength(fileName, 'utf8') <= 240);
  assert.match(fileName, /^.*-00000000-0000-0000-0000-000000000001\.mp3$/);
});
