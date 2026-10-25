import * as crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import https from 'node:https';
import { pipeline } from 'node:stream';
import { buildAudioFilePath } from './voiceoverFilePolicy.js';

const getAudioFilePath = (
  messageText: string,
  directory = os.tmpdir(),
  uniqueSuffix: string = crypto.randomUUID(),
) => buildAudioFilePath(messageText, directory, uniqueSuffix);

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

export default {
  downloadAudioFile,
  getAudioFilePath,
  removeAudioFile,
  getVoiceoverStream,
};
