const https = require('https');
const fs = require('fs');

const voiceoverDir = 'var/voiceover/';

const downloadAudioFile = async (audioUrl, fileName) => {
  const file = fs.createWriteStream(`${voiceoverDir}/${fileName}`);

  return new Promise((resolve, reject) => {
    https
      .get(audioUrl, (response) => {
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const removeAudioFile = (fileName) => {
  fs.unlink(`${voiceoverDir}/${fileName}`, (err) => {
    if (err && err.code === 'ENOENT') {
      // file doens't exist
      console.info("File doesn't exist, won't remove it.");
    } else if (err) {
      // other errors, e.g. maybe we don't have enough permission
      console.error('Error occurred while trying to remove file');
    } else {
      console.info(`removed`);
    }
  });
};

const getVoiceoverStream = (fileName) => {
  return fs.createReadStream(`${voiceoverDir}/${fileName}`);
};

module.exports = { downloadAudioFile, removeAudioFile, getVoiceoverStream };
