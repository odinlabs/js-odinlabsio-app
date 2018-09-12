/** components/session/index.js */
const session = require('express-session');

module.exports.configure = (app) => {
  const sessionOptions = {
    secret: 'ddsosecret',
    resave: false,
    saveUninitialized: true,
    cookie: {},
    maxAge: 60*60*1000,
  };
  if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sessionOptions.cookie.secure = true; // serve secure cookies
    sessionOptions.cookie.httpOnly = true;
  } else {
    sessionOptions.cookie.secure = false; // serve secure cookies
    sessionOptions.cookie.httpOnly = false;
  }
  app.use(session(sessionOptions));
};
