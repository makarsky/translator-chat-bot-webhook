const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const voiceoverService = require('../src/api/voiceoverService');

test('audio filenames sanitize path characters and reserved names', () => {
  const filePath = voiceoverService.getAudioFilePath(
    '../CON: <audio>?*',
    os.tmpdir(),
    'unique',
  );
  const fileName = path.basename(filePath);

  assert.equal(path.dirname(filePath), os.tmpdir());
  assert.doesNotMatch(fileName, /[<>:"/\\|?*]/);
  assert.equal(
    Array.from(fileName).some((character) => /\p{Cc}/u.test(character)),
    false,
  );
  assert.doesNotMatch(
    fileName,
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i,
  );
  assert.match(fileName, /audio/);
});

test('audio filenames are shortened to the byte limit and remain unique', () => {
  const messageText = '你好'.repeat(300);
  const firstPath = voiceoverService.getAudioFilePath(
    messageText,
    os.tmpdir(),
    'first',
  );
  const secondPath = voiceoverService.getAudioFilePath(
    messageText,
    os.tmpdir(),
    'second',
  );
  const firstName = path.basename(firstPath);

  assert.ok(Buffer.byteLength(firstName, 'utf8') <= 240);
  assert.notEqual(firstPath, secondPath);
});

test('temporary voiceover files can be removed and missing files are harmless', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'voiceover-test-'));
  const filePath = path.join(directory, 'audio.mp3');

  try {
    await fs.writeFile(filePath, 'audio');
    await voiceoverService.removeAudioFile(filePath);

    await assert.rejects(fs.access(filePath));
    await assert.doesNotReject(voiceoverService.removeAudioFile(filePath));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
