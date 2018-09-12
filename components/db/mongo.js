const _ = require('underscore');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = require('mongodb').ObjectID;
/**
 * Consent {uuid, object}
 */
function ConsentDataStore() {
}
mongoose.model('ConsentDataStore', new Schema({
  code: { type: String },
  consentData: Schema.Types.Mixed
}));
const ConsentDataStoreModel = mongoose.model('ConsentDataStore');

function findConsent(code) {
  return ConsentDataStoreModel.findOne({ code }).lean();
}
ConsentDataStore.prototype.find = findConsent;

function saveConsent(consent) {
  return ConsentDataStoreModel.create({
    code: consent.code,
    consentData: consent.consentData,
  });
}
ConsentDataStore.prototype.save = saveConsent;

exports.ConsentDataStore = ConsentDataStore;
/**
 * User {id, accountName, accountPassword}
 */
function UserStore() {
}
const UserStoreSchema = new Schema({
  username: String,
  facebook: {
    id: String,
    token: String,
    name: String,
  }
});
mongoose.model('UserStore', UserStoreSchema);

const UserModel = mongoose.model('UserStore');

function findUser(criteria) {
  return UserModel.findOne(criteria).lean();
}
UserStore.prototype.find = findUser;

function findUserByID(id) {
  return UserModel.findOne({ _id: new ObjectId(id) }).lean();
}
UserStore.prototype.findById = findUserByID;

function saveUser(user) {
  return findUser(user.accountName).lean().then((found) => {
    if (found) return false;
    return UserModel.create(user);
  });
}
UserStore.prototype.save = saveUser;

exports.UserStore = UserStore;

/**
 * Client {id, client_id, clientSecret, redirectUris, grants}
 * Client: {
 *  id: Integer,
 *  client_id: String,
 *  clientSecret: String,
 *  grants: [ String ],
 *  redirectUris: [ String ],
 *  ccubePermissionDesc: { type: [new Schema({ name: { type: String }, group: { type: [[String]] } })] },
 * }
 */
function ClientStore() {
}
const ClientStoreSchema = new Schema({
  client_id: { type: String },
  clientSecret: { type: String },
  grants: { type: [String] },
  redirectUris: { type: [String] },
  ccubePermissionDesc: { type: [new Schema({ name: { type: String }, group: { type: [[String]] } })] },
  appDescription: { type: String },
});
mongoose.model('ClientStore', ClientStoreSchema);

const ClientModel = mongoose.model('ClientStore');

function findClient(clientId) {
  return ClientModel.findOne({ client_id: clientId }).lean();
}
ClientStore.prototype.find = findClient;

function findClientById(id) {
  return ClientModel.findOne({ _id: new ObjectId(id) }).lean();
}
ClientStore.prototype.findById = findClientById;

function saveClient(client) {
  return ClientModel.create({
    client_id: client.client_id,
    clientSecret: client.clientSecret,
    grants: client.grants,
    redirectUris: client.redirectUris,
    ccubePermissionDesc: client.ccubePermissionDesc,
    appDescription: client.appDescription,
  });
}
function validateSaveClient(next) {
  const self = this;
  ClientModel.findOne({ client_id: this.client_id }, (err, result) => {
    if (err) {
      next(err);
    } else if (result) {
      self.invalidate(`Client ${self.client_id} already exist!`);
      next(new Error(`Client ${self.client_id} already exist!`));
    } else {
      next();
    }
  });
}
ClientStoreSchema.pre('save', validateSaveClient);
ClientStore.prototype.save = saveClient;

function updateClient(id, client) {
  return ClientModel.update({ _id: id }, client).lean();
}
ClientStore.prototype.update = updateClient;

exports.ClientStore = ClientStore;

/**
 * AuthorizationCode: {
 *  code: String,
 *  scope: String,
 *  expiresAt: Date,
 *  redirectUri: String,
 *  client: Client,
 *  user: User
 * }
 */
function AuthorizationCodeStore() {
}
mongoose.model('AuthorizationCodeStore', new Schema({
  code: { type: String },
  scope: { type: [String] },
  expiresAt: { type: Date },
  redirectUri: { type: String },
  client: { type: Schema.Types.ObjectId, ref: 'ClientStore' },
  user: { type: Schema.Types.ObjectId, ref: 'UserStore' },
}));

const AuthorizationCodeModel = mongoose.model('AuthorizationCodeStore');

function findAuthorizationCode(code) {
  return AuthorizationCodeModel.findOne({ code }).populate('client').populate('user').lean();
}
AuthorizationCodeStore.prototype.find = findAuthorizationCode;

function saveAuthorizationCode(authorizationCode) {
  return AuthorizationCodeModel.create({
    code: authorizationCode.code,
    scope: authorizationCode.scope,
    expiresAt: authorizationCode.expiresAt,
    redirectUri: authorizationCode.redirectUri,
    client: authorizationCode.client._id,
    user: authorizationCode.user._id,
  });
}
AuthorizationCodeStore.prototype.save = saveAuthorizationCode;

exports.AuthorizationCodeStore = AuthorizationCodeStore;
/**
 * Token: {
 *  accessToken: String,
 *  accessTokenExpiresAt: Date,
 *  refreshToken: String,
 *  refreshTokenExpiresAt: Date,
 *  user: User
 * }
 */
function TokenStore() {
}
mongoose.model('TokenStore', new Schema({
  accessToken: { type: String },
  accessTokenExpiresAt: { type: Date },
  refreshToken: { type: String },
  refreshTokenExpiresAt: { type: Date },
  consentCode: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'UserStore' },
}));

const TokenModel = mongoose.model('TokenStore');

function findToken(accessToken) {
  return TokenModel.findOne({ accessToken }).populate('user').lean();
}
TokenStore.prototype.findToken = findToken;

function saveToken(token) {
  return TokenModel.create({
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    consentCode: token.consentCode,
    user: token.user._id,
  });
}
TokenStore.prototype.save = saveToken;

exports.TokenStore = TokenStore;
