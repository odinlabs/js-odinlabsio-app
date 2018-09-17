/** components/oauth/server.js */
const moment = require('moment');
const passport = require('passport');
const oauth2orize = require('oauth2orize');
const utils = require('odin-utils');
const jwt = require('jsonwebtoken');
const ecdsa_256 = require('../utils').ecdsa_256;
const db = require('../db');

const server = oauth2orize.createServer();
const hash = utils.crypto.hash_sha1;
const awaitPromise = utils.promise.consumeWithCallback;
const logger = utils.logger.appLog;
const error = utils.logger.errorLog;

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated. To complete the transaction, the
// user must authenticate and approve the authorization request. Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session. Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient((client, done) => done(null, client.client_id));

server.deserializeClient((id, done) => {
    const client = db.getClient(id);
    awaitPromise(client, done);
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources. It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes. The callback takes the `client` requesting
// authorization, the `redirectUri` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application. The application issues a code, which is bound to these
// values, and will be exchanged for an access token.
server.grant(oauth2orize.grant.code((client, redirectUri, user, ares, done) => {
    logger.debug('server-grant-code %s %s %s %s', user, client.client_id, ares, redirectUri);
    if (!client) {
        return done(new Error("Undefined client"));
    }
    if (!user) {
        return done(new Error("Undefined user"));
    }
    const scope = [];
    Object.keys(ares.permissions).forEach(function (key) {
        var val = ares.permissions[key];
        if (scope.lastIndexOf(key) === -1 && val.accepted) {
            scope.push(key);
        }
    });
    // uuid
    hash(16).then((uuid) => {
        // create grant token data
        const grant_token = {
            code: uuid,
            scope,
            expiresAt: moment().add(ares.expiresIn, 'second'),
            redirectUri,
            client,
            user,
        };
        jwt.sign({ azp: client.client_id, jti: uuid }, ecdsa_256.private("odinlabs-app"), { algorithm: "ES256", issuer: "odinlabs-app", expiresIn: ares.expiresIn }, function (err, jwt_token) {
            if (err) {
                error.error('server-grant-jwt-error %s', err);
                return done(err);
            }
            logger.debug('server-grant-jwt %s', jwt_token);
            const result = Promise.all([db.saveAuthorizationCode(grant_token), db.saveConsentData({ code: uuid, consentData: ares.permissions })]).catch(err => {
                error.error('server-grant-code failed to save authorization code and consent data. %s', err);
            });
            awaitPromise(result, (err, tokens) => {
                if (err) {
                    error.error('server-grant-code failed %s', err);
                    return done(err);
                }
                logger.debug('server-granted-code %s %s', tokens, jwt_token);
                return done(null, jwt_token);
            });
            /*const result = db.saveAuthorizationCode(grant_token);
            awaitPromise(result, (err, token) => {
                if (err) {
                    error.error('server-grant-code failed %s', err);
                    return done(err);
                }
                logger.debug('server-granted-code %s %s', token, jwt_token);
                return done(null, jwt_token);
            });*/
        });
    }).catch((err) => {
        error.error('server-grant-code failed %s', err);
        done(err);
    });
}));

// Exchange authorization codes for access tokens. The callback accepts the
// `client`, which is exchanging `code` and any `redirectUri` from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.
server.exchange(oauth2orize.exchange.code((clientId, jwt_grant_token, redirectUri, done) => {
    logger.debug('server-exchange-code %s %s %s', clientId, jwt_grant_token, redirectUri);

    jwt.verify(jwt_grant_token, ecdsa_256.public("odinlabs-app"), { algorithms: ['ES256'], issuer: "odinlabs-app" }, function (err, payload) {
        if (err) {
            error.error('server-exchange-code-not-valid %s', err);
            return done(err);
        }
        logger.debug('server-exchange-code-valid-payload %s', payload);

        const jwt_access_token_result = db.getAuthorizationCode(payload.jti).then((grant_token) => {
            logger.debug('server-exchange-code-grant %s', grant_token);
            if (!grant_token) return Promise.reject(new Error('Unknown grant_code'));
            if (redirectUri !== grant_token.redirectUri) return Promise.reject(new Error('Redirect Uri does not match'));
            return grant_token;
        }).then((valid_grant_token) => {
            logger.debug('server-exchange-code-grant-valid %s', valid_grant_token);
            const expiresIn = 60 * 60;
            return Promise.all([hash(256), hash(256)]).then((uuids) => {
                const exchange_token = {
                    accessToken: uuids[0],
                    accessTokenExpiresAt: moment().add(expiresIn, 'seconds'),
                    refreshToken: uuids[1],
                    refreshTokenExpiresAt: moment().add(expiresIn, 'seconds'),
                    user: valid_grant_token.user,
                    consentCode: payload.jti
                };
                const jwt_access_token = jwt.sign({ azp: valid_grant_token.client.client_id, jti: uuids[0], scope: valid_grant_token.scope }, ecdsa_256.private("odinlabs-app"), { algorithm: "ES256", issuer: "odinlabs-app", expiresIn });
                if (jwt_access_token) {
                    return db.saveAccessToken(exchange_token).then((result) => {
                        logger.debug('server-exchange-code-save-access-token %s %s', result, jwt_grant_token);
                        return jwt_access_token;
                    });
                } else {
                    return Promise.reject(new Error('Failed to sign jwt access to'));
                }
            });
        });
        awaitPromise(jwt_access_token_result, (err, jwt_access_token) => {
            if (err) {
                error.error('server-exchange-code-failed %s', err);
                return done(err)
            }
            logger.debug('server-exchange-code-issued %s %s', jwt_access_token, jwt_grant_token);
            return done(null, jwt_access_token);
        });
    });
}));

module.exports.authorization = [
    server.authorization((clientId, redirectUri, scope, done) => {
        const client = db.getClient(clientId);
        awaitPromise(client, (err, result) => {
            if (err) {
                return done(err);
            }
            if (result) {
                const idx = result.redirectUris.lastIndexOf(redirectUri);
                if (idx === -1) {
                    return done(new Error(`Unauthorized URI ${redirectUri}`));
                }
                return done(null, result, redirectUri);
            }
            return done(new Error(`Unauthorized Client ${clientId}`));
        });
    }), server.errorHandler({ mode: 'indirect' })];

module.exports.resume = server.resume((oauth, done) => {
    return done(null, false, { permissions: oauth.locals.permissions });
});

module.exports.grant = server.decision((req, done) => {
    const params = {
        expiresIn: 60,
        permissions: req.oauth2.info.permissions,
    };
    return done(null, params);
});

module.exports.token = [
    passport.authenticate(['oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()];