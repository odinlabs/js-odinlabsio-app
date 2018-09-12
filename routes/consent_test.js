/** routes/oauth.js */
const express = require('express');
const login = require('connect-ensure-login');
const logger = require('odin-utils').logger;
const taxonomy = require('odin-taxonomy').model;

const oauthServer = require('../components/oauth').server;
const db = require('../components/db');


const router = express.Router();

module.exports.configure = (done) => {
    // get consent dialog test
    router.get('/', (request, response, next) => {
        return db.getClient("skiers-paradise").then((client) => {
            return taxonomy.tree(taxonomy.schema, (errDST, schemaTree) => {
                const data = [];
                client.ccubePermissionDesc.forEach((desc) => {
                    schemaTree.parse(desc, (errParse, permission) => {
                        if (permission) {
                            data.push(permission);
                        }
                    });
                });
                logger.appLog.debug('Consent Taxonomy Tree : %s', data);
                return taxonomy.flat(data, (errFlat, flatTree) => {
                    logger.appLog.debug('Consent Taxonomy Flat : %s', flatTree);

                    response.render('consent', { transaction_id: '000001', grants: { permissions: flatTree } });
                })
            });
        }).catch((err) => { next(null, err) });
    });  
    // post consent data in session test
    router.post('/authorization/data', (req, res, next) => {
        logger.appLog.debug("TransactionID %s Consents %s", req.body.transaction_id, req.body.consents);
        res.sendStatus(200);
    });
 
    // POST accept authorization
    router.post('/grant', /*login.ensureLoggedIn(),*/ oauthServer.grant);
    // POST token
    router.post('/token', oauthServer.token);// TODO authenticate client
    // GET authentification
    router.get('/authentification', /*login.ensureLoggedIn(),*/ oauthServer.authorization, (req, res, next) => {
        req.oauth2.info = { permissions: [] };
        next();
    }, oauthServer.grant);

    // GET resource grants
    router.get('/:clientid/:token/grants', (req, res, next) => { // TODO authenticate client
        db.getAccessToken(req.params.token).then((accessToken) => {
            if (accessToken) {
                return dssoccube.getPermissionClient(req.params.clientid, accessToken.user.accountName).then((permissions) => {
                    const result = [];
                    let nextPermission = permissions.next();
                    while (!nextPermission.done) {
                        result.push(nextPermission.value);
                        nextPermission = permissions.next();
                    }
                    res.send(result);
                });
            }
            return res.sendStatus(400);
        }).catch((err) => { next(err); });
    });
    
    // GET resource user
    router.get('/:token/user', (req, res, next) => { // TODO authenticate client
        db.getAccessToken(req.params.token).then((accessToken) => {
            if (accessToken) {
                const user = { id: accessToken.user._id, username: accessToken.user.accountName };
                return res.send(user);
            }
            return res.sendStatus(400);
        }).catch((err) => { next(err); });
    });
    done(null, router);
};