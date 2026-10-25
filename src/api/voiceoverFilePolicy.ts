import path from 'node:path';

const maxFileNameBytes = 240;
const extension = '.mp3';

export const sanitizeVoiceoverText = (messageText: string): string => {
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

  return safeText;
};

export const buildAudioFilePath = (
  messageText: string,
  directory: string,
  uniqueSuffix: string,
): string => {
  const safeText = sanitizeVoiceoverText(messageText);
  const suffix = `-${uniqueSuffix}${extension}`;
  const safeCharacters: string[] = [];

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
