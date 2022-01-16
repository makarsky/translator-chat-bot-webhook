const defaultLanguageCode = 'en';

const localizations = {
  about: {
    be: '[Рэпазітар]($1)\n\n[Прапановы / Паведаміць аб памылцы]($1/issues/new)\n\nЗрабіў з 🛠️ Ігар Макарскі',
    en: '[Repository]($1)\n\n[Suggestions / Bug Report]($1/issues/new)\n\nMade with 🛠️ by Igor Makarsky',
    ru: '[Репозиторий]($1)\n\n[Предложения / Отчёты об ошибках]($1/issues/new)\n\nАвтор: Игорь Макарский',
    uk: '[Репозиторій]($1)\n\n[Пропозиції / Повідомити про помилку]($1/issues/new)\n\nЗроблено з 🛠️ Ігорем Макарським',
  },
  chooseInterfaceLanguage: {
    be: 'Выберыце мову інтэрфейсу:',
    en: 'Choose the interface language:',
    ru: 'Выберите язык интерфейса:',
    uk: 'Виберіть мову інтерфейсу:',
  },
  chooseTargetLanguage: {
    be: 'Абярыце мову перакладу:',
    en: 'Choose the target language:',
    ru: 'Выберите язык перевода:',
    uk: 'Виберіть мову перекладу:',
  },
  commandDescriptionAbout: {
    be: 'Інфармацыя пра чат-бот',
    en: 'About',
    ru: 'Информация о боте',
    uk: 'Інформація про чат-бот',
  },
  commandDescriptionSetInterfaceLanguage: {
    be: 'Задаць мову інтэрфейсу',
    en: 'Set interface language',
    ru: 'Установить язык интерфейса',
    uk: 'Встановити мову інтерфейсу',
  },
  commandDescriptionSetTargetLanguage: {
    be: 'Устанавіць мову перакладу',
    en: 'Set target language',
    ru: 'Установить язык перевода',
    uk: 'Встановити мову перекладу',
  },
  interfaceLanguageStatus: {
    be: 'Мова інтэрфейсу: $1 ($2).',
    en: 'Interface language: $1 ($2).',
    ru: 'Язык интерфейса: $1 ($2).',
    uk: 'Мова інтерфейсу: $1 ($2).',
  },
  listen: {
    be: '🔊 праслухаць',
    en: '🔊 listen',
    ru: '🔊 прослушать',
    uk: '🔊 прослухати',
  },
  targetLanguageStatus: {
    be: 'Мова перакладу: $1 ($2). Дашліце тэкст для перакладу.',
    en: 'Target language: $1 ($2). Send a text to translate.',
    ru: 'Язык перевода: $1 ($2). Отправьте текст для перевода.',
    uk: 'Мова перекладу: $1 ($2). Надішліть текст для перекладу.',
  },
  unsuitableTargetLanguage: {
    be: 'Ваш тэкст на той жа мове, што і мова перакладу. Выберыце іншую мову перакладу:',
    en: 'Your text is in the same language as the target language. Choose another target language:',
    ru: 'Ваш текст на том же языке, что и язык перевода. Выберите другой язык перевода:',
    uk: 'Ваш текст тією ж мовою, що і мова перекладу. Виберіть іншу мову перекладу:',
  },
};

const t = (key, languageCode, replacements = []) => {
  const newLanguageCode = languageCode || defaultLanguageCode;

  const text =
    localizations[key] && localizations[key][newLanguageCode]
      ? localizations[key][newLanguageCode]
      : localizations[key][defaultLanguageCode];

  if (replacements.length === 0) {
    return text;
  }

  // replaceAll() throws TypeError: acc.replaceAll is not a function
  return replacements.reduce(
    (acc, v, i) => acc.split(`$${i + 1}`).join(v),
    text,
  );
};

module.exports = localizations;
module.exports.t = t;
