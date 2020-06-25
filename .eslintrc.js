module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    jquery: true
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  rules: {
    'comma-dangle': 0
  },
};
