const localizations = {
    about: {
        be: '[Рэпазітар]($1)\n\n[Прапановы / Паведаміць аб памылцы]($1/issues/new)\n\nЗрабіў з 🛠️ Ігар Макарскі',
        en: '[Repository]($1)\n\n[Suggestions / Bug Report]($1/issues/new)\n\nMade with 🛠️ by Igor Makarsky',
        ru: '[Репозиторий]($1)\n\n[Предложения / Отчёты об ошибках]($1/issues/new)\n\nАвтор: Игорь Макарский',
        uk: '[Репозиторій]($1)\n\n[Пропозиції / Повідомити про помилку]($1/issues/new)\n\nЗроблено з 🛠️ Ігорем Макарським',
    },
    chooseTargetLanguage: {
        be: 'Выберыце мэтавую мову:',
        en: 'Choose the target language:',
        ru: 'Выбери целевой язык:',
        uk: 'Виберіть цільову мову:',
    },
    lister: {
        be: '🔊 праслухаць',
        en: '🔊 listen',
        ru: '🔊 прослушать',
        uk: '🔊 прослухати',
    },
    targetLanguageStatus: {
        be: 'Мэтавая мова: $1 ($2). Дашліце тэкст для перакладу.',
        en: 'Target language: $1 ($2). Send a text to translate.',
        ru: 'Целевой язык: $1 ($2). Отправьте текст для перевода.',
        uk: 'Мова перекладу: $1 ($2). Надішліть текст для перекладу.',
    },
    unsuitableTargetLanguage: {
        be: 'Ваш тэкст на той жа мове, што і мэтавая мова. Выберыце іншую мэтавую мову:',
        en: 'Your text is in the same language as the target language. Choose another target language:',
        ru: 'Ваш текст на том же языке, что и целевой язык. Выберите другой целевой язык:',
        uk: 'Ваш текст написано тією ж мовою, що й цільова мова. Виберіть іншу цільову мову:',
    },
};

const t = (key, languageCode, replacements = []) => {
    languageCode = languageCode || 'en';

    const text = localizations[key] ? localizations[key][languageCode] : '';

    if (replacements.length === 0) {
        return text;
    }

    // replaceAll() throws TypeError: acc.replaceAll is not a function
    return replacements.reduce((acc, v, i) => acc.split(`$${i + 1}`).join(v), text);
};

module.exports = localizations;
module.exports.t = t;
