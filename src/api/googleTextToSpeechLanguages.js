// https://cloud.google.com/speech-to-text/docs/languages
const languageCodes = [
  'af-ZA',
  'sq-AL',
  // 'am-ET', // 400 HTTP error from google
  'ar-DZ',
  'ar-BH',
  'ar-EG',
  'ar-IQ',
  'ar-IL',
  'ar-JO',
  'ar-KW',
  'ar-LB',
  'ar-MA',
  'ar-OM',
  'ar-QA',
  'ar-SA',
  'ar-PS',
  'ar-TN',
  'ar-AE',
  'ar-YE',
  'hy-AM',
  // 'az-AZ', // 400 HTTP error from google
  // 'eu-ES', // 400 HTTP error from google
  'bn-BD',
  'bn-IN',
  'bs-BA',
  'bg-BG',
  'my-MM',
  'ca-ES',
  'yue-Hant-HK',
  'zh',
  'zh-TW',
  'hr-HR',
  'cs-CZ',
  'da-DK',
  'nl-BE',
  'nl-NL',
  // 'en-AU',
  // 'en-CA',
  // 'en-GH',
  // 'en-HK',
  // 'en-IN',
  // 'en-IE',
  // 'en-KE',
  // 'en-NZ',
  // 'en-NG',
  // 'en-PK',
  // 'en-PH',
  // 'en-SG',
  // 'en-ZA',
  // 'en-TZ',
  // 'en-GB',
  'en-US',
  'et-EE',
  'fil-PH',
  'fi-FI',
  // 'fr-BE',
  // 'fr-CA',
  'fr-FR',
  // 'fr-CH',
  // 'gl-ES', // 400 HTTP error from google
  // 'ka-GE', // 400 HTTP error from google
  // 'de-AT',
  'de-DE',
  // 'de-CH',
  'el-GR',
  'gu-IN',
  'iw-IL',
  'hi-IN',
  'hu-HU',
  'is-IS',
  'id-ID',
  'it-IT',
  'it-CH',
  'ja-JP',
  'jv-ID',
  'kn-IN',
  // 'kk-KZ', // 400 HTTP error from google
  'km-KH',
  'ko-KR',
  // 'lo-LA', // 400 HTTP error from google
  'lv-LV',
  // 'lt-LT', // 400 HTTP error from google
  'mk-MK',
  'ms-MY',
  'ml-IN',
  'mr-IN',
  // 'mn-MN', // 400 HTTP error from google
  'ne-NP',
  'no-NO',
  // 'fa-IR', // 400 HTTP error from google
  'pl-PL',
  'pt-BR',
  'pt-PT',
  // 'pa-Guru-IN', // 400 HTTP error from google
  'ro-RO',
  'ru-RU',
  'sr-RS',
  'si-LK',
  'sk-SK',
  // 'sl-SI', // 400 HTTP error from google
  // 'es-AR',
  // 'es-BO',
  // 'es-CL',
  // 'es-CO',
  // 'es-CR',
  // 'es-DO',
  // 'es-EC',
  // 'es-SV',
  // 'es-GT',
  // 'es-HN',
  // 'es-MX',
  // 'es-NI',
  // 'es-PA',
  // 'es-PY',
  // 'es-PE',
  // 'es-PR',
  'es-ES',
  'es-US',
  // 'es-UY',
  // 'es-VE',
  'su-ID',
  'sw-KE',
  'sw-TZ',
  'sv-SE',
  'ta-IN',
  'ta-MY',
  'ta-SG',
  'ta-LK',
  'te-IN',
  'th-TH',
  'tr-TR',
  'uk-UA',
  'ur-IN',
  'ur-PK',
  // 'uz-UZ', // 400 HTTP error from google
  'vi-VN',
  // 'zu-ZA', // 400 HTTP error from google
];

const findByCode = (code) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const languageCode of languageCodes) {
    if (code === 'zh-CN') {
      return 'zh';
    }
    if (code === 'zh-TW') {
      return 'zh-TW';
    }
    if (languageCode.indexOf(code) === 0) {
      return languageCode;
    }
  }

  return null;
};

module.exports = { findByCode };
