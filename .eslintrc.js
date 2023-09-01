module.exports = {
  extends: [
    'plugin:promise/recommended'
  ],
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'module'
  },
  env: {
    es6: true,
    node: true,
    jest: true
  },
  plugins: [
    'import',
    'node',
    'promise'
  ],
  parser: '@typescript-eslint/parser',
  rules: {
    'comma-dangle': [
      'error',
      'only-multiline'
    ],
    complexity: ['error', 10],
    'func-names': 'off',
    'handle-callback-err': [
      'error',
      '^(err|error)$'
    ],
    'node/no-deprecated-api': 'error',
    'node/process-exit-as-throw': 'error',
    'operator-linebreak': [
      'error',
      'after',
      {
        overrides: {
          ':': 'before',
          '?': 'before'
        }
      }
    ],
    'quote-props': [
      1,
      'as-needed',
      {
        unnecessary: true
      }
    ],
    semi: 'error',
  },
  globals: {
    App: true,
    Page: true,
    Component: true,
    Behavior: true,
    wx: true,
  },
};
