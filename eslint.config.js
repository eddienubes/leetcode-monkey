const tseslint = require('typescript-eslint')

module.exports = [
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'no-public' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowFunctionsWithoutTypeParameters: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
  {
    // https://eslint.org/docs/latest/use/configure/ignore#ignoring-files
    ignores: [
      '**/node_modules',
      '**/build',
      '.yarn',
      '**/sdk',
      '!**/sdk/types/*',
    ],
  },
]
