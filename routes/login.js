/** routes/login.js */
const express = require('express');
const passport = require('passport');
const utils = require('odin-utils');
const logger = utils.logger.appLog;
const error = utils.logger.errorLog;

const router = express.Router();

module.exports.configure = (done) => {
  // GET login form
  router.get('/', (request, response) => {
    response.render('login', { message: request.flash('loginMessage') });
  });
  // login with facebook
  router.get('/facebook', passport.authorize('facebook', {
    scope: ['email']
  }));
  // facebook callback  /facebook/callback
  router.get('/facebook/callback', passport.authenticate('facebook', { successReturnToOrRedirect: '/', failureRedirect: '/login' }));
  /*router.get('/facebook/callback', (request, response, next) => {
    passport.authenticate('facebook', (error, user, info) => {
      if (error) {
        next(error);
      } else {
        if (user) {
          request.login(user, (errorLogin) => {
            if (errorLogin) {
              next(errorLogin);
            } else {
              request.session.save((errorSaveSession) => {
                if (errorSaveSession) {
                  next(errorSaveSession);
                } else {
                  response.redirect(request.session.returnTo);
                }
              });
            }
          });
        } else {
          response.redirect('/login');
        }
      }
    })(request, response, next);
  });*/

  // login with googleplus
  done(null, router);
};
