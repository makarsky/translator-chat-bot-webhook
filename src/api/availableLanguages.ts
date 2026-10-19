const { languages } = require('google-translate-api-x');

interface LanguageOption {
  code: string;
  language: string;
}

const availableLanguages: LanguageOption[] = [];

Object.keys(languages).forEach((key) => {
  if (key !== 'auto' && key !== 'isSupported' && key !== 'getCode') {
    availableLanguages.push({ code: key, language: languages[key] });
  }
});

availableLanguages.sort((a, b) => a.language.localeCompare(b.language));

module.exports = availableLanguages;
