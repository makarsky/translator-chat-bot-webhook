const languages = require('@vitalets/google-translate-api/languages');

const availableLanguages = [];

Object.keys(languages).forEach((key) => {
  if (key !== 'auto' && key !== 'isSupported' && key !== 'getCode') {
    availableLanguages.push({ code: key, language: languages[key] });
  }
});

availableLanguages.sort((a, b) => a.language.localeCompare(b.language));

module.exports = availableLanguages;
