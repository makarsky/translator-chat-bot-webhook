import * as crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { pipeline } from 'node:stream';

const maxFileNameBytes = 240;
const extension = '.mp3';

const getAudioFilePath = (
  messageText: string,
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

const downloadAudioFile = async (
  audioUrl: string,
  messageText: string,
): Promise<string> => {
  const filePath = getAudioFilePath(messageText);

  try {
    await new Promise<void>((resolve, reject) => {
      const request = https.get(audioUrl, (response) => {
        const statusCode = response.statusCode as number;
        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`Audio download failed: HTTP ${statusCode}`));
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

const removeAudioFile = async (filePath: string): Promise<void> => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
};

const getVoiceoverStream = (filePath: string) => fs.createReadStream(filePath);

module.exports = {
  downloadAudioFile,
  getAudioFilePath,
  removeAudioFile,
  getVoiceoverStream,
};
