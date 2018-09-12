# js-odinlabsio-app

Welcome to OdinLabs IO.

## Table of Contents

- [Overview](#overview)
  - [Quick Summary](#quick-summary)
- [How it works](#how-it-works)
  - [Authentification]
  - [Signed Consent Collection]
  - [Consent Configuration]
- [License](#license)

## Overview

OdinLabs IO develops set of tools allowing web application developers to collect and distribute verifiable data.

### Quick Summary

OdinLabsIO APP is an Oauth2 server:
- simple user authentification
OdinLabsIO APP is a consent management server:
- signed and verifiable user consent collection

## How it works

odinlabs-app provides authentification and consent service as an Oauth2 endpoints. js-odinlabsio-sdk is an express middleware similar to passport-js wrapping calls to the previous endpoints.

### Authentification
SSO style user authentification

```
const passport = require('passport');
const ConsentServer = require('odin-sdk').consent.ConsentServer;

const ConsentServerInstance = new ConsentServer(passport, function (user, permission, cb) {
    return cb(null, user, permission);
  }, options);
// authentify user
app.get('/', ConsentServerInstance.authentify({ failureRedirect: '/error' }), function (req, res) {
    res.render('index');
  });
// call back for authentification
app.get('/odinsdk/callback/authentification', ConsentServerInstance.authentify(), function (request, response) {
    response.redirect(request.session.odinsdk.successRedirect);
  });
```

### Signed Consent Collection
Authentified consent collection.

A consent is a grant or permission given by a user to a client allowing collection, usage and distribution of personal data.

```
const passport = require('passport');
const ConsentServer = require('odin-sdk').consent.ConsentServer;

const ConsentServerInstance = new ConsentServer(passport, function (user, permission, cb) {
    return cb(null, user, permission);
  }, options);

// ask consent
app.get('/', ConsentServerInstance.consent({ failureRedirect: '/error' }), function (req, res) {
    res.render('index');
  });
// call back for consent
app.get('/odinsdk/callback/consent', ConsentServerInstance.consent(), function (request, response) {
    response.redirect(request.session.odinsdk.successRedirect);
  });
```


### Consent Configuration

client can configure consent preferences and dialogs through odinlabs-app-developers-app.

### Consent Verification

TODO

## License

MIT
