# js-odinlabsio-app

Welcome to OdinLabs IO.

## Table of Contents

- [Overview](#overview)
  - [Quick Summary](#quick-summary)
- [How it works](#how-it-works)
  - [Authentification](#authentification)
  - [Signed Consent Collection](#signed-consent-collection)
  - [Consent Configuration](#consent-configuration)
- [Usage](#usage)
  - [Create app id and secret](#create-app-id-and-secret)
  - [Configure SDK](#configure-sdk)
  - [Example](#example)
- [License](#license)

## Overview

OdinLabs IO develops set of tools allowing web application developers to collect and distribute verifiable data.

### Quick Summary

OdinLabsIO APP is an express web app providing:
- verifiable user authentification
- signed and verifiable user consent collection

## How it works

odinlabs-app provides authentification and consent service as an Oauth2 endpoints. [js-odinlabsio-sdk](https://github.com/odinlabs/js-odinlabsio-sdk) is an express middleware similar to passport-js wrapping calls to the previous endpoints.

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

client can configure consent preferences and dialogs. For consent configuration refer too [js-odinlabsio-developers](https://github.com/odinlabs/js-odinlabsio-developers)

### Consent Verification

todo consent verification

## Usage

### Create app id and secret

#### Create app account
![Alt text](/doc/images/signup.png?raw=true&s=100 "Create Account")
<img src=/doc/images/signup.png width="auto" max-height="50%" />

#### Create app description and secret
![Alt text](/doc/images/app-account-description.png?raw=true "Create Account Description and Secrets")

#### Create Oauth settings
![Alt text](/doc/images/app-accout-redirect-uris.png?raw=true "Create OAuth Callback URIs")

#### Create Consent
![Alt text](/doc/images/app-account-permission.png?raw=true "Create Consent")

![Alt text](/doc/images/user-grants-simple.png?raw=true "Consent User View")

### Configure SDK

### Example

## License

MIT
