var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');

passport.use(new BasicStrategy(
  function(userName, userPassword, callback) {
    User.findOne({ email: userName }, function (err, user) {

      if (err) { return callback(err); }

      // No user found with that email
      if (!user) { return callback(null, false); }

      // Make sure the password is correct
      user.verifyPassword(userPassword, function(err, isMatch) {
        if (err) { return callback(err); }

        // Password did not match
        if (!isMatch) { return callback(null, false); }

        // Success
        return callback(null, user);
      });
    });
  }
));

exports.isAuthenticated = function(req, res, next, secret) {
  passport.authenticate('basic', { 
  session : false 
  }, function(err, user, info) {
      if (err) { return next(err) }
      if (user) {
        var token = user.createToken(secret);
        res.json({ token: token });
      } else {
        res.status(401).json({ message: 'Unauthorized access!' });
      }
    })(req, res, next);
};

