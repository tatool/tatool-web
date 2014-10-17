// Load required packages
var User = require('../models/user');

exports.register = function(req, res) {
  // check if user already exists and add otherwise
  User.find({email: req.body.email}, function(err, result) {
    if (err) res.status(500).send(err);

    if (!result.length) {
      // Create a new user
      var user = new User();

      user.email = req.body.email;
      user.password = req.body.password;
      user.updated_at = new Date();

      user.save(function(err) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({ message: 'User successfully added to the db!', data: user });
        }
      });

    } else {
      res.status(401).json({ message: 'User already exists!' });
    }
  });
};