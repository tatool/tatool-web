// Load required packages
var uuid = require('uuid');
var User = require('../models/user');
var Counter = require('../models/counter');
var UserModule = require('../models/module').userModule;
var DeveloperModule = require('../models/module').developerModule;
var RepositoryModule = require('../models/module').repositoryModule;
var Project = require('../models/project');
var mkdirp = require('mkdirp');
var rmdir = require('rimraf');

exports.getUsers = function(req, res) {
  User.find( { tempUser: null }, function(err, users) {
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
      var oldRoles = user.roles;
      user.roles = req.body.roles;
      user.updated_at = new Date();

      var isAdmin = false;
      for (var i = 0; i < user.roles.length; i++) {
        if (user.roles[i] === 'admin') {
          isAdmin = true;
          break;
        }
      }

      // only allow one admin user
      if (isAdmin && oldRoles.indexOf('admin') === -1) {
        User.findOne({ roles: { $in: ['admin'] } }, function(err, adminUser) {
          if (err) {
            res.status(500).send(err);
          } else {

            if (adminUser) {
              res.status(500).json({ message: 'Admin role is already assigned to another user. There can be only one!'});
            } else {
              user.save(function(err) {
                if (err) {
                  res.status(500).json({ message: 'Update of user failed.', data: err });
                } else {
                  res.json({ message: 'User successfully updated.', data: user });
                }
              });
            }

          }
        });
      } else {
        user.save(function(err) {
          if (err) {
            res.status(500).json({ message: 'Update of user failed.', data: err });
          } else {
            res.json({ message: 'User successfully updated.', data: user });
          }
        });
      }

    } else {
      // Create a new user
      var user = new User();

      user.email = req.body.email;
      user.password = req.body.password;
      user.roles.push('user');
      user.verified = true;
      user.token = '';
      user.updated_at = new Date();

      Counter.getUserCode(function (err, userCode) {
        if (err) {
          res.status(500).json({ message: 'Can\'t add user. Please try again later.', data: err });
        } else {
          user.code = userCode.next;
          user.save(function(err) {
            if (err) {
              res.status(500).json({ message: 'Can\'t add user. Please try again later.', data: err });
            } else {
              res.json( { message: 'User successfully added.' });
            }
          });
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

exports.getAllProjects = function(req, res) {
  Project.find( {}, function(err, projects) {
    if (err) {
      res.status(500).json({message: 'Error reading projects.'});
    } else {
      res.json(projects);
    }
  });
}

exports.addProject = function(req, res) {

  Project.findOne({name: req.params.project, access: req.params.access}, function(err, project) {
    if (err) res.status(500).send(err);

    if (project) {
      project.description = req.body.description;
      project.executables = req.body.executables;

      project.save(function(err) {
        if (err) {
          res.status(500).json({ message: 'Can\'t edit project. Please try again later.', data: err });
        } else {
          res.json( { message: 'Project saved successfully.' });
        }
      });

    } else {
      var project = new Project();
      project.name = req.body.name;
      project.access = req.body.access;
      project.email = req.body.email;
      project.description = req.body.description;
      project.executables = req.body.executables;

      var projectPath = '';
      if (project.access === 'private') {
        projectPath = 'app/projects/' + project.access + '/' + project.email + '/' + project.name;
      } else {
        projectPath = 'app/projects/' + project.access + '/' + project.name;
      }

      mkdirp(projectPath, function (err) {
        if (err) {
          res.status(500).json({ message: 'Can\'t add project. Please try again later.', data: err });
        } else {
          mkdirp(projectPath + '/' + 'executables', function (err) {
            if (err) {
              res.status(500).json({ message: 'Can\'t add project. Please try again later.', data: err });
            } else {
              mkdirp(projectPath + '/' + 'instructions', function (err) {
                if (err) {
                  res.status(500).json({ message: 'Can\'t add project. Please try again later.', data: err });
                } else {
                  mkdirp(projectPath + '/' + 'stimuli', function (err) {
                    if (err) {
                      res.status(500).json({ message: 'Can\'t add project. Please try again later.', data: err });
                    } else {
                      mkdirp(projectPath + '/' + 'modules', function (err) {
                        if (err) {
                          res.status(500).json({ message: 'Can\'t add project. Please try again later.', data: err });
                        } else {
                          project.save(function(err) {
                            if (err) {
                              res.status(500).json({ message: 'Can\'t add project. Please try again later.', data: err });
                            } else {
                              res.json( { message: 'Project added successfully.' });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
          
        }
      });
    }
  });
};

exports.deleteProject = function(req, res) {

  Project.findOne({name: req.params.project, access: req.params.access}, function(err, project) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (project) {

        var projectPath = '';
        if (project.access === 'private') {
          projectPath = 'app/projects/' + project.access + '/' + project.email + '/' + project.name;
        } else {
          projectPath = 'app/projects/' + project.access + '/' + project.name;
        }

        Project.remove({ _id: project._id }, function(err, project) {
          if (err) {
            res.status(500).send(err);
          } else {

            rmdir(projectPath, function(error){
              if (error) {
                res.status(500).send(err);
              } else {
                res.json(project);
              }
            });
            
          }
        });
      } else {
        res.json({});
      }
    }
  });

};

// add/update built-in projects at startup
exports.initProjects = function(projects) {
  var projects = projects.projects;
  saveAll(projects);
};

function saveAll(projects) {
  var project = projects.pop();

  Project.findOne({name: project.name, access: project.access}, function(err, prj) {
    if (err) res.status(500).send(err);

    if (prj) {

      prj.description = project.description;
      prj.executables = project.executables;

      prj.save(function(err) {
        if (err) {
          console.log('Can\'t update built-in projects.');
        } else {
          if (projects.length > 0) {
            saveAll(projects);
          }
        }
      });

    } else {
      var newProject = new Project();
      newProject.name = project.name;
      newProject.access = project.access;
      newProject.email = project.email;
      newProject.description = project.description;
      newProject.executables = project.executables;

      newProject.save(function(err) {
        if (err) {
          console.log('Can\'t add built-in projects.');
        } else {
          if (projects.length > 0) {
            saveAll(projects);
          }
        }
      });
    }
  });

};