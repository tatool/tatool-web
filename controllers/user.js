// Load required packages
var User = require('../models/user');

exports.register = function(req, res) {

  // check if user already exists and add otherwise
  User.findOne({email: req.body.userName}, function(err, result) {
    if (err) res.status(500).send(err);

    if (!result) {
      // Create a new user
      var user = new User();

      user.email = req.body.userName;
      user.password = req.body.userPassword;
      user.roles.push('user');
      user.updated_at = new Date();

      user.save(function(err) {
        if (err) {
          res.status(500).json({ message: 'Registration failed.', data: err });
        } else {
          res.json({ message: 'User successfully added to the db!', data: user });
        }
      });

    } else {
      res.status(500).json({ message: 'The email address is already registered.' });
    }
  });
};