const { jsWithTs: jestPreset } = require('ts-jest/presets');

module.exports = {
  transform: {
    ...jestPreset.transform,
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(js?|ts?)$',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
  ],
  moduleNameMapper: {
    '^@awesome-cordova-plugins/core$': '<rootDir>/node_modules/@awesome-cordova-plugins/core',
    '^cordova/utils$': '<rootDir>/node_modules/cordova-js/src/common/utils',
    'rxjs': '<rootDir>/node_modules/rxjs',
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setupJest.js'
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(@ionic-native)/)"
  ]
}
