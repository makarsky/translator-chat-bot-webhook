const eslint = require('@eslint/js');
const globals = require('globals');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  {
    ignores: ['dist/**', 'public/**', 'node_modules/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      'no-console': 'off',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          endOfLine: 'auto',
        },
      ],
    },
  },
];
