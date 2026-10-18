const ua = require('universal-analytics');

const categories = {
  translator: 'translator',
};

const actions = {
  start: 'start',
  setTargetLanguage: 'setTargetLanguage',
  targetLanguageSelected: 'targetLanguageSelected',
  translate: 'translate',
  listen: 'listen',
  about: 'about',
};

const event = (userId, category, action, label, value, params) => {
  if (!process.env.GOOGLE_UNIVERSAL_ANALYTICS_ID) {
    return Promise.resolve();
  }

  const visitor = ua(process.env.GOOGLE_UNIVERSAL_ANALYTICS_ID, `${userId}`, {
    strictCidFormat: false,
  });

  return new Promise((resolve) => {
    visitor.event(category, action, label, value, params).send((error) => {
      if (error) {
        console.error('Google Analytics event failed', error);
      }
      resolve();
    });
  });
};

module.exports = {
  categories,
  actions,
  event,
};
