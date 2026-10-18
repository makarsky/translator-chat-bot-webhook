const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream');

const maxFileNameBytes = 240;
const extension = '.mp3';

const getAudioFilePath = (
  messageText,
  directory = os.tmpdir(),
  uniqueSuffix = crypto.randomUUID(),
) => {
  let safeText = String(messageText)
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\p{Cc}/gu, '_')
    .replace(/\s+/g, '_')
    .replace(/[. ]+$/g, '')
    .replace(/^\.+/g, '');

  if (!safeText || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(safeText)) {
    safeText = 'voiceover';
  }

  const suffix = `-${uniqueSuffix}${extension}`;
  const safeCharacters = [];

  for (const character of safeText) {
    const nextName = `${safeCharacters.join('')}${character}${suffix}`;
    if (Buffer.byteLength(nextName, 'utf8') > maxFileNameBytes) {
      break;
    }
    safeCharacters.push(character);
  }

  const fileName = `${safeCharacters.join('') || 'voiceover'}${suffix}`;
  return path.join(directory, fileName);
};

const downloadAudioFile = async (audioUrl, messageText) => {
  const filePath = getAudioFilePath(messageText);

  try {
    await new Promise((resolve, reject) => {
      const request = https.get(audioUrl, (response) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(
            new Error(`Audio download failed: HTTP ${response.statusCode}`),
          );
          return;
        }

        pipeline(response, fs.createWriteStream(filePath), (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      request.on('error', reject);
    });

    return filePath;
  } catch (error) {
    await fs.promises.unlink(filePath).catch(() => {});
    throw error;
  }
};

const removeAudioFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

const getVoiceoverStream = (filePath) => fs.createReadStream(filePath);

module.exports = {
  downloadAudioFile,
  getAudioFilePath,
  removeAudioFile,
  getVoiceoverStream,
};
