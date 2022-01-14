const ua = require('universal-analytics');

const categories = {
  translator: 'translator',
};

const actions = {
  start: 'start',
  setTargetLanguage: 'setTargetLanguage',
  targetLanguageSelected: 'targetLanguageSelected',
  setInterfaceLanguage: 'setInterfaceLanguage',
  interfaceLanguageSelected: 'interfaceLanguageSelected',
  translate: 'translate',
  listen: 'listen',
  about: 'about',
};

const event = (userId, category, action, label, value, params) => {
  const visitor = ua(process.env.GOOGLE_UNIVERSAL_ANALYTICS_ID, `${userId}`, {
    strictCidFormat: false,
  });
  visitor.event(category, action, label, value, params).send();
};

module.exports = {
  categories,
  actions,
  event,
};
