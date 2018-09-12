/** components/db/index.js */
const mongoose = require('mongoose');
const utils = require('odin-utils');
const dbConfig = require('../../config/mongo/mongoose-config');
const store = require('./mongo');

const logger = utils.logger.appLog;
const error = utils.logger.errorLog;

mongoose.connect(dbConfig.url, (err) => {
  if (err) {
    return error.error('Mongoose connect failed %s', err);
  }
  return logger.info('Mongoose connect sucess %s', dbConfig.user);
});

const Users = store.UserStore;
const ConsentDatas = store.ConsentDataStore;
const Clients = store.ClientStore;
const AuthCodes = store.AuthorizationCodeStore;
const Tokens = store.TokenStore;

/**
 * User Table
 */
const userTable = new Users();
/**
 * @param {String} accountName
 */
module.exports.getUser = (accountName) => {
  return userTable.find(accountName);
};

/**
 * @param {*} id
 */
module.exports.getUserById = (id) => {
  return userTable.findById(id);
};

/**
 * @param {Object} user
 */
module.exports.saveUser = (user) => {
  return userTable.save(user);
};

/**
 * Consent Table
 */
const consentDataTable = new ConsentDatas();

/**
 * @param {String} code
 */
module.exports.getConsentData = (code) => {
  return consentDataTable.find(code);
};
/**
 * @param {Object} consent
 */
module.exports.saveConsentData = (consentData) => {
  return consentDataTable.save(consentData);
};

/**
 * Client Table
 */
const clientTable = new Clients();
/**
 * @param {String} clientAccountName
 */
module.exports.getClient = (clientId) => {
  return clientTable.find(clientId);
};
/**
 * @param {*} clientId
 */
module.exports.getClientById = (id) => {
  return clientTable.findById(id);
};
/**
 * @param {Object} client
 */
module.exports.saveClient = (client) => {
  return clientTable.save(client);
};
/**
 * @param {Object} id
 * @param {String} appDescription
 * @param {String} appLogo
 */
module.exports.updateClientDescription = (id, appDescription, appLogo) => {
  const client = { appDescription };
  return clientTable.update(id, client);
};
/**
 * @param {Object} id
 * @param {Array} uris
 */
module.exports.updateClientRedirectUris = (id, uris) => {
  const client = { redirectUris: uris };
  return clientTable.update(id, client);
};
/**
 * @param {Object} id
 * @param {Array} uris
 */
module.exports.removeClientRedirectUris = (id, uris) => {
  const removedUris = { $pullAll: { redirectUris: uris } };
  return clientTable.update(id, removedUris);
};
/**
 * @param {Object} id
 * @param  {Array} uris
 */
module.exports.addClientRedirectUris = (id, uris) => {
  const addedUris = { $addToSet: { redirectUris: { $each: uris } } };
  return clientTable.update(id, addedUris);
};
/**
 * @param {Object} id
 * @param {String} client
 */
module.exports.updateClientCCubePermissionDesc = (id, grants) => {
  return clientTable.findById(id).then((client) => {
    if (client) {
      grants.forEach((grant) => {
        client.ccubePermissionDesc.push(grant);
      });
      const reduceDuplicate = client.ccubePermissionDesc.reduce((init, element) => {
        const pre = init.get(element.name);
        if (pre) {
          element.group.forEach((path) => { pre.group.push(path); });
        } else {
          init.set(element.name, element);
        }
        return init;
      }, new Map());
      return clientTable.update(id, { $set: { ccubePermissionDesc: Array.from(reduceDuplicate.values()) } });
    }
    return Promise.reject(new Error(`Client ${id} does not exist`));
  });
};
/**
 * Authorization Code Table
 */
const codeTable = new AuthCodes();
/**
 * @param {String} code
 */
module.exports.getAuthorizationCode = (code) => {
  return codeTable.find(code);
};
/**
 * @param {Object} authCode
 */
module.exports.saveAuthorizationCode = (authCode) => {
  return codeTable.save(authCode);
};
/**
 * Access Token Table
 */
const tokenTable = new Tokens();
/**
 * @param {Object} token
 */
module.exports.saveAccessToken = (token) => {
  return tokenTable.save(token);
};

module.exports.getAccessToken = (token) => {
  return tokenTable.findToken(token);
};

