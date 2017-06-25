exports.config = {
  allScriptsTimeout: 11000,

  specs: ['test/e2e/**/*.js'],

  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://localhost:8001/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
