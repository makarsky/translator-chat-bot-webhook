const languages = require('@vitalets/google-translate-api/languages');

const availableLanguages = [];

Object.keys(languages).forEach((key) => {
  if (key !== 'auto' && key !== 'isSupported' && key !== 'getCode') {
    availableLanguages.push({ code: key, language: languages[key] });
  }
});

availableLanguages.sort((a, b) => a.code.localeCompare(b.code));

module.exports = availableLanguages;
