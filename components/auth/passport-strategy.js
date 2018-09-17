/** components/auth/passport-strategy.js */
const FacebookStrategy = require('passport-facebook').Strategy;
const GooglePlusStrategy = require('passport-google-oauth').OAuth2Strategy;
const mongoose = require('mongoose');
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const utils = require('odin-utils');


const facebookConfig = require('../../config/auth/facebook-config');
const googleplusConfig = require('../../config/auth/googleplus-config');

const awaitPromise = utils.promise.consumeWithCallback;

const UserModel = mongoose.model('UserStore');
const ClientModel = mongoose.model('ClientStore');

/**
 * Configure facebook login and googleplus login strategies for passport.
 * @param {*} passport
 */
module.exports.local = (passport) => {
  // used to serialize user in session
  passport.serializeUser((user, done) => {
    if (user.facebook) {
      return done(null, { id: user.facebook.id, provider: "facebook" });
    } else {
      return done(new Error("Unknow user id schema"));
    }
  });
  passport.deserializeUser((serialized, done) => {
    if (serialized.provider == "facebook") {
      const user = UserModel.findOne({ 'facebook.id': serialized.id });
      if (user) {
        return awaitPromise(user, done);
      }
      return done(null, false);
    } else {
      return done(new Error("Unknown user id schema."));
    }
  });

  /**
   * Facebook login
   */
  passport.use('facebook', new FacebookStrategy(
    {
      // pull in our app id and secret from our auth.js file
      clientID: facebookConfig.clientID,
      clientSecret: facebookConfig.clientSecret,
      callbackURL: facebookConfig.callbackURL,
    },
    (token, refreshToken, profile, done) => {
      process.nextTick(function () {
        utils.logger.appLog.info('Facebook login profile: %s', profile);
        UserModel.findOne({ 'facebook.id': profile.id }).lean().then((found) => {
          if (found) {
            return UserModel.create({ username: profile.displayName, facebook: { id: profile.id, name: profile.displayName, token } });
            // return UserModel.findOneAndUpdate({ 'facebook.id': profile.id }, { $set: { facebook: { token } } });
          } else {
            return UserModel.create({ username: profile.displayName, facebook: { id: profile.id, name: profile.displayName, token } });
          }
        }).then((user) => {
          utils.logger.appLog.info('Facebook logged in user: %s', user);
          done(null, user.toObject());
        }).catch(err => done(err));
      });
    }
  ));
  /**
   * GooglePlus login
   */
  passport.use('google', new GooglePlusStrategy(
    {
      clientID: googleplusConfig.clientID,
      clientSecret: googleplusConfig.clientSecret,
      callbackURL: googleplusConfig.callbackURL,
    },
    (token, refreshToken, profile, done) => {
      const user = { provider: 'google', google: {} };
      user.google.id = profile.id;
      user.google.name = profile.displayName;
      utils.logger.appLog.info('Google login: %s', user);
      done(new Error("GooglePlus strategy pending implementation"));
    }
  ));

  passport.use(new ClientPasswordStrategy((clientId, clientSecret, done) => {
    ClientModel.findOne({ client_id: clientId }).lean().then((client) => {
      // verify client
      if (!client) {
        utils.logger.errorLog.error('authenticate-client client does not exist %s', clientId);
        return done(null, false);
      }
      // verify client secret
      if (client.clientSecret !== clientSecret) {
        utils.logger.errorLog.error('authenticate-client client secret does not match %s', clientId);
        return done(null, false);
      }
      return done(null, client)
    }).catch((err) => {
      utils.logger.errorLog.error('authenticate-client failed to authenticate client %s %s', clientId, err);
      done(err);
    });
  }));
};
