/** components/auth/index.js */
const passport = require('passport');
const strategy = require('./passport-strategy');

module.exports.configure = (app) => {
  // add local strategy to passport
  strategy.local(passport);
  // add passport as middleware
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
};

module.exports.facebookauthorize = passport.authorize('facebook', {
  scope: ['public_profile', 'email'],
});
module.exports.facebookdecision = passport.authorize('facebook');

module.exports.googleauthorize = passport.authorize('google', {
  scope: ['profile', 'email'],
});
module.exports.googledecision = passport.authorize('google');

