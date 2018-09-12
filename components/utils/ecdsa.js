const fs = require('fs');

const certSK = fs.readFileSync('sk256v1.pem');
const certPK = fs.readFileSync('pk256v1.pem'); // get public key

function privateKey(tenant, algorithm, done) {
    return done ? done(null, certSK) : certSK;
};
function publicKey(tenant, algorithm, done) {
    return done ? done(null, certPK) : certPK;
};

module.exports = {
    private: privateKey,
    public: publicKey
}