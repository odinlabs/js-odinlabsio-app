/** routes/oauth.js */
const express = require('express');
const jwt = require('express-jwt');
const login = require('connect-ensure-login');
const logger = require('odin-utils').logger;
const taxonomy = require('odin-taxonomy').model;

const oauthServer = require('../components/oauth').server;
const db = require('../components/db');
const ecdsa_256 = require('../components/utils').ecdsa_256;


const router = express.Router();

module.exports.configure = (done) => {
    // get consent dialog
    router.get('/', login.ensureLoggedIn(), oauthServer.authorization, (request, response, next) => {
        return taxonomy.tree(taxonomy.schema, (errDST, schemaTree) => {
            if (errDST) { 
                return next(errDST); 
            }
            const data = [];
            request.oauth2.client.ccubePermissionDesc.forEach((desc) => {
                if (request.oauth2.req.scope.lastIndexOf(desc.name) !== -1) {
                    schemaTree.parse(desc, (errParse, permission) => {
                        if (permission) {
                            data.push(permission);
                        }
                    });
                }
            });
            logger.appLog.debug('Consent Taxonomy Tree : %s', data);
            return taxonomy.flat(data, (errFlat, flatTree) => {
                if (errFlat) {
                    return next(errFlat);
                }
                logger.appLog.debug('Consent Taxonomy Flat : %s', flatTree);
                if (flatTree && flatTree.length > 0) {

                    return response.render('consent', { transaction_id: request.oauth2.transactionID, grants: { permissions: flatTree } });
                } else {
                    
                    request.oauth2.info = { permissions: [] };
                    return next();
                }
            })
        });
    }, oauthServer.grant);
    // post consent data in session
    router.post('/authorization/data', login.ensureLoggedIn(), (request, response, next) => {
        response.locals = response.locals || {};
        response.locals.permissions = request.body.consents;
        next();
    }, oauthServer.resume, (request, response) => {
        response.sendStatus(200);
    });

    // POST accept authorization
    router.post('/grant', login.ensureLoggedIn(), oauthServer.grant);
    // POST token
    router.post('/token', oauthServer.token);// TODO authenticate client
    // GET authentification
    router.get('/authentification', login.ensureLoggedIn(), oauthServer.authorization, (request, response, next) => {
        request.oauth2.info = { permissions: [] };
        next();
    }, oauthServer.grant);

    // GET resource grants
    router.get('/:clientid/:token/grants', (request, response, next) => { // TODO authenticate client
        db.getAccessToken(request.params.token).then((accessToken) => {
            if (accessToken) {
                return dssoccube.getPermissionClient(request.params.clientid, accessToken.user.accountName).then((permissions) => {
                    const result = [];
                    let nextPermission = permissions.next();
                    while (!nextPermission.done) {
                        result.push(nextPermission.value);
                        nextPermission = permissions.next();
                    }
                    response.send(result);
                });
            }
            return response.sendStatus(400);
        }).catch((err) => { next(err); });
    });
    function getToken(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        } else if (req.params && req.params.token) {
            return req.params.token;
        }
        return null;
    }

    // GET resource user
    router.get('/:token/user', jwt({ secret: ecdsa_256.public("odinlabs"), issuer: "odinlabs-app", requestProperty: 'oauth', getToken }), (request, response, next) => { // TODO authenticate client
        db.getAccessToken(request.oauth.jti).then((accessToken) => {
            if (accessToken) {
                const user = { id: accessToken.user._id, username: accessToken.user.facebook.name, provider: "facebook" };
                return response.send(user);
            }
            return response.sendStatus(400);
        }).catch((err) => { next(err); });
    });

    // GET resource user
    router.get('/:token/consent', jwt({ secret: ecdsa_256.public("odinlabs"), issuer: "odinlabs-app", requestProperty: 'oauth', getToken }), (request, response, next) => { // TODO authenticate client
        db.getAccessToken(request.oauth.jti).then((accessToken) => {
            if (accessToken) {
                const user = { id: accessToken.user._id, username: accessToken.user.facebook.name, provider: "facebook" };
                return db.getConsent(accessToken.consentCode).then((consent) => {
                    if (consent) {
                        return response.send({ user, permission: consent.permission });
                    }
                    return response.sendStatus(400);
                });
            }
            return response.sendStatus(400);
        }).catch((err) => { next(err); });
    });

    // GET resource user
    router.get('/:token/permission', jwt({ secret: ecdsa_256.public("odinlabs"), issuer: "odinlabs-app", requestProperty: 'oauth', getToken }), (request, response, next) => { // TODO authenticate client
        db.getAccessToken(request.oauth.jti).then((accessToken) => {
            logger.appLog.debug("Retrieve permission for acces token %s", accessToken);
            if (accessToken) {
                return db.getConsentData(accessToken.consentCode).then((consent) => {
                    if (consent) {
                        return response.send({ permission: consent.consentData });
                    }
                    return response.sendStatus(400);
                })
            }
            return response.sendStatus(400);
        }).catch((err) => { next(err); });
    });
    done(null, router);
};