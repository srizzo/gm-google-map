exports.config = {
  allScriptsTimeout: 11000,

  specs: ['test/e2e/**/*.js'],

  capabilities: {
    'browserName': 'firefox'
  },

  baseUrl: 'http://localhost:8001/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
