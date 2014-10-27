// Load required packages
var User = require('../models/user');

exports.getUsers = function(req, res) {
  User.find( function(err, users) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(users);
    }
  });
};

exports.updateUser = function(req, res) {
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) res.status(500).send(err);

    if (user) {
      user.roles = req.body.roles;
      user.updated_at = new Date();

      user.save(function(err) {
        if (err) {
          res.status(500).json({ message: 'Update of user failed!', data: err });
        } else {
          res.json({ message: 'User successfully updated!', data: user });
        }
      });

    } else {
      res.status(500).json({ message: 'The user could not be found!' });
    }
  });
};

exports.removeUser = function(req, res) {
  User.remove({ _id: req.params.user }, function(err, user) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(user);
    }
  });
};