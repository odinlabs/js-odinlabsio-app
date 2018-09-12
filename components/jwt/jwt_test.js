var jwt = require('jsonwebtoken');
var util = require('../utils');

jwt.sign({ foo: "bar", azp: "authorized_party", jti: "" }, util.ecdsa_256.private(), { algorithm: "ES256", issuer: "odinlabs", expiresIn: 60 }, function (err, token) {
    if (err) return console.log(err);
    console.log(token);
    // alg mismatch
    jwt.verify(token, util.ecdsa_256.public(), { algorithms: ['ES256'] }, function (err, payload) {
        if (err)
            return console.log(err);
        console.log(payload);
    });
});
