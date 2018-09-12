/** routes/site.js */
const express = require('express');

const router = express.Router();

module.exports.configure = (done) => {
  // GET site homepage
  router.get('/', (request, response) => {
    if (request.isAuthenticated()) {
      const array_providers = [];
      for (var key in request.user) {
        array_providers.push(key);
      }
      Object.keys(request.user).forEach(function (key) {
        //if (key != 'username') {
        //}
      });
      console.log(request.user);
      console.log(array_providers);
      response.render('index', { username: request.user.username, providers: ['facebook', 'google'] });
    } else {
      response.render('index', { username: undefined});
    }
  });
  done(null, router);
};
