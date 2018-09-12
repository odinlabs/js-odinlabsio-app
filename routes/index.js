/** routes/index.js */
const site = require('./site').configure;
const login = require('./login').configure;
const consent = require('./consent').configure;
// const consent_test = require('./consent_test').configure;

module.exports.configure = (app) => {
  site((err, router) => { app.use('/', router); });
  login((err, router) => { app.use('/login', router); });
  consent((err, router) => { app.use('/consent', router); });
};
