const express = require('express');
const fs = require('fs')
const https = require('https')
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const utils = require('odin-utils');

const routes = require('./routes').configure;
const error = require('./components/error').configure;
const session = require('./components/session').configure;
const auth = require('./components/auth').configure;

// create app
const app = express();
// runtime param
const port = process.env.PORT || 3000;
// logging
app.error = utils.logger.errorLog;
app.logger = utils.logger.appLog;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('ddsosecret'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', [
    express.static(path.join(__dirname, 'node_modules/jquery/dist')), // jquery.min.js
    express.static(path.join(__dirname, 'node_modules/bootstrap-treeview/dist')), // bootstrap-treeview.min.css bootstrap-treeview.min.js
    express.static(path.join(__dirname, 'public/bootstrap')),
    express.static(path.join(__dirname, 'public'))
]);
// add session middleware
session(app);
// add auth middleware
auth(app);
app.use(flash());

// add routes middleware
routes(app);
// add error middleware
error(app);

// start server
https.createServer({
    key: fs.readFileSync('local.server.key'),
    cert: fs.readFileSync('local.server.cert')
}, app)
    .listen(port, function () {
        app.logger.info('DSSO Service listening on port %s', port);
    });


module.exports = app;
