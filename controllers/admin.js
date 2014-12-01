// Load required packages
var uuid = require('node-uuid');
var User = require('../models/user');
var UserModule = require('../models/module').userModule;
var DeveloperModule = require('../models/module').developerModule;
var RepositoryModule = require('../models/module').repositoryModule;

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
          res.status(500).json({ message: 'Update of user failed.', data: err });
        } else {
          res.json({ message: 'User successfully updated.', data: user });
        }
      });

    } else {
      // Create a new user
      var user = new User();

      user.email = req.body.email;
      user.password = req.body.password;
      user.roles.push('user');
      user.verified = true;
      user.fullName = '';
      user.affiliation = '';
      user.token = '';
      user.updated_at = new Date();

      user.save(function(err) {
        if (err) {
          res.status(500).json({ message: 'Can\'t add user. Please try again later.', data: err });
        } else {
          res.json( { message: 'User successfully added.' });
        }
      });
    }
  });
};

exports.updatePassword = function(req, res) {
  User.findOne({ _id: req.params.user }, function(err, user) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (user) {
        user.password = req.body.password;
        user.updated_at = new Date();

        user.save(function(err) {
          if (err) {
            res.status(500).json({ message: 'Can\'t change password. Please try again later.', data: err });
          } else {
            res.json( { message: 'Password changed successfully.' });
          }
        });

      } else {
        res.status(500).json({ message: 'User could not be found.' });
      }
    }
  });
};

// removes the user and all of his user/developer/repository modules
exports.removeUser = function(req, res) {

  User.findOne({ _id: req.params.user }, function(err, user) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (user) {
        User.remove({ _id: req.params.user }, function(err, delUser) {
          if (err) {
            res.status(500).send(err);
          } else {

            UserModule.remove({ email: user.email }, function(err, module) {
              if (err) {
                res.status(500).send(err);
              } else {

                DeveloperModule.remove({ email: user.email }, function(err, module) {
                  if (err) {
                    res.status(500).send(err);
                  } else {
                    
                    RepositoryModule.remove({ email: user.email }, function(err, module) {
                      if (err) {
                        res.status(500).send(err);
                      } else {
                        res.json(user);
                      }
                    });

                  }
                });

              }
            });

          }
        });
      } else {
        res.status(500).send({ message: 'User could not be found.'});
      }
    }
  });

};