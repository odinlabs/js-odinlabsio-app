module.exports.clientID = 'put facebook client id here';
module.exports.clientSecret = 'put facebook client secret here';
module.exports.callbackURL = 'https://local.odinlabs.io:3000/login/facebook/callback';
module.exports.profileURL = 'https://graph.facebook.com/v3.1/me?fields=email',
module.exports.profileFields = ['id', 'email', 'name'] // For requesting permissions from Facebook API
