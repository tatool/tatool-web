// Load dependencies
var User = require('../models/user');
var Counter = require('../models/counter');
var uuid = require('uuid');
var postmark = require('postmark')(process.env.POSTMARK_API_KEY);
var request = require('request');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var ejs = require('ejs');
var Q = require('q');


// register new user and send verification email
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
      if (req.body.devAccess) {
        user.roles.push('developer');
        user.roles.push('analytics');
      }
      user.verified = false;
      user.token = uuid.v4();
      user.updated_at = new Date();

      Counter.getUserCode(function (err, userCode) {
        if (err) {
          res.status(500).json({ message: 'Can\'t add user. Please try again later.', data: err });
        } else {
          user.code = userCode.next;
          user.save(function(err) {
            if (err) {
              res.status(500).json({ message: 'Registration failed. Please try again later.', data: err });
            } else {

              var message = {
                email: user.email,
                name: user.email,
                subject: 'Confirm your email address',
                template: 'registration-email',
                verifyURL: req.protocol + '://' + req.get('host') + '/user/verify/' + user.token};
              
              sendVerificationEmail(message, function (error, success) {
                if (error) {
                  console.error('Unable to send email: ' + error.message);
                  user.remove();
                  res.status(500).json({ message: 'Unable to send verification email. Please try again later.' });
                } else {
                  if (req.body.devAccess) {
                    exports.signupDev(req, res);
                  } else {
                    res.json({ message: 'User successfully added!' });
                  }
                }
              });
            }
          });
        }
      });   
    } else {
      res.status(500).json({ message: 'The email address is already registered.' });
    }
  });
};

// creates a temp user for public modules
exports.getTempUser = function(req, res) {
  var deferred = Q.defer();

  var extid = '';

  if (req.query.extid && req.query.extid !== '') {
    extid = req.query.extid;
  }

  User.findOne({ extid: extid, tempUser: true, moduleid: req.params.moduleId }, function (err, user) {

      if (err) { deferred.reject({ message: 'User registration failed.', data: err }); }

      // Existing user
      if (user) {  
        deferred.resolve(user);
      } else {
      // Create new temp user
        var user = new User();

        user.roles.push('user');
        user.verified = true;
        user.tempUser = true;
        user.moduleid = req.params.moduleId;
        if (req.query.extid && req.query.extid !== '') {
          user.extid = req.query.extid;
        }
        user.updated_at = new Date();

        Counter.getUserCode(function (err, userCode) {
          if (err) {
            deferred.reject({ message: 'User registration failed.', data: err });
          } else {
            user.code = userCode.next;
            user.email = userCode.next.toString();
            user.password = userCode.next;
            user.save(function(err) {
              if (err) {
                deferred.reject({ message: 'User registration failed.', data: err });
              } else {
                deferred.resolve(user);
              }
            });
          }
        }); 
      }

  });

  return deferred.promise;
};

exports.verifyCaptcha = function(req, res) {
  var privateKey = req.app.get('captcha_private_key');

  if (privateKey) {

    var options = {
      uri: 'https://www.google.com/recaptcha/api/siteverify?secret=' + privateKey + '&response=' + req.body.response,
      method: 'POST'
    };

    request(options, function (error, response, body) {
      var captcha = JSON.parse(body);
      if (captcha.success) {
        res.json();
      } else {
        res.status(500).json({ message: 'Captcha verification failed.'});
      }
    });

  } else {
    res.json();
  }
};

// resend email verification email
exports.verifyResend = function(req, res) {
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) res.status(500).send(err);

    if (user) {
      // Update existing user with a new token
      user.verified = false;
      user.token = uuid.v4();
      user.updated_at = new Date();

      user.save(function(err) {
        if (err) {
          res.status(500).json({ message: 'Verification failed. Please try again later.', data: err });
        } else {

          var message = {
            email: user.email,
            name: user.email,
            subject: 'Confirm your email address',
            template: 'registration-email',
            verifyURL: req.protocol + '://' + req.get('host') + '/user/verify/' + user.token};
          
          sendVerificationEmail(message, function (error, success) {
            if (error) {
              console.error('Unable to send email: ' + error.message);
              res.status(500).json({ message: 'Unable to send verification email. Please try again later.' });
            } else {
              res.json({ message: 'Verification email sent!' });
            }
          });
        }
      });

    } else {
      res.status(500).json({ message: 'The email address is not yet registered.' });
    }
  });
};

// send reset password email
exports.resetPasswordSend = function(req, res) {
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) res.status(500).send(err);

    if (user) {

      if (!user.verified) {
        res.status(500).json({ message: 'Account not verified yet. Please verify your account first by opening the link in your verification email.', verify: true });
      } else {
        // Update existing user with a new token
        user.verified = false;
        user.token = uuid.v4();
        user.updated_at = new Date();

        user.save(function(err) {
          if (err) {
            res.status(500).json({ message: 'Password reset failed. Please try again later.', data: err });
          } else {

            var message = {
              email: user.email,
              name: user.email,
              subject: 'Password reset',
              template: 'password-reset-email',
              pwURL: req.protocol + '://' + req.get('host') + '/#/reset?token=' + user.token};
          
            sendVerificationEmail(message, function (error, success) {
              if (error) {
                console.error('Unable to send email: ' + error.message);
                res.status(500).json({ message: 'Unable to send password reset email. Please try again later.' });
              } else {
                res.json({ message: 'Password reset email sent successfully.' });
              }
            });
          }
        });
      }

    } else {
      res.status(500).json({ message: 'The email address could not be found.' });
    }
  });
};

// check reset password token for validity
exports.verifyResetToken = function(req, res) {
  User.findOne({token: req.params.token}, function(err, user) {
    if (err) res.status(500).send(err);

    if (user) {
      res.json({ token: req.params.token } );
    } else {
      res.status(500).json({ message: 'The user could not be found!' });
    }
  });
};

// update user password
exports.updatePassword = function(req, res) {
  User.findOne({token: req.body.token}, function(err, user) {
    if (err) res.status(500).send(err);

    if (user) {
      user.verified = true;
      user.token = '';
      user.password = req.body.userPassword;
      user.updated_at = new Date();

      user.save(function(err) {
        if (err) {
          res.status(500).json({ message: 'Update of user failed!', data: err });
        } else {
          res.json({ message: 'User successfully updated!' });
        }
      });

    } else {
      res.status(500).json({ message: 'The user could not be found!' });
    }
  });
};

// verify user email
exports.verifyUser = function(req, res) {
    User.findOne({token: req.params.token}, function (err, doc){
        if (err) res.redirect('login?verify=failure');
        if (doc) {
          User.findOne({email: doc.email}, function (err, user) {
            if (err) res.redirect('login?verify=failure');
            user.verified = true;
            user.token = '';
            user.save(function(err) {
                if (err) {
                  res.redirect('/#/login?verify=failure');
                } else {
                  res.redirect('/#/login?verify=success');
                }
            });
          });
        } else {
          res.redirect('/#/login?verify=failure');
        }
    });
};

exports.signupDev = function(req, res) {

  var message = {
      email: process.env.SENDER_EMAIL,
      name: process.env.SENDER_EMAIL,
      subject: 'Developer Signup',
      template: 'developer-signup-email',
      user: req.body.userName
  };

  sendVerificationEmail(message, function (error, success) {
    if (error) {
      console.error('Unable to send email: ' + error.message);
      res.status(500).json({ message: 'Unable to send email. Please try again later.' });
    } else {
      res.json({ message: 'Signup successful' });
    }
  });
};

// creates default admin user for lab mode
exports.registerAdmin = function() {
  // check if user already exists and add otherwise
  User.findOne( { roles: { $in: [ 'admin'] } }, function(err, result) {
    if (err) console.log('Admin registration failed. Please make sure the database is running.');

    if (!result) {

      User.findOne( { email: 'admin@tatool-web.com' }, function(err, adminAccount) {
        if (err) console.log('Admin registration failed. Please make sure the database is running.');

        if (!adminAccount) {
          // Create admin user
          var user = new User();
          user.email = 'admin@tatool-web.com';
          user.password = '1234';
          user.roles.push('user');
          user.roles.push('admin');
          user.verified = true;
          user.token = '';
          user.updated_at = new Date();

          Counter.getUserCode(function (err, userCode) {
            if (err) {
              console.log('Admin registration failed. Please make sure the database is running.');
            } else {
              user.code = userCode.next;
              user.save(function(err) {
                if (err) {
                  console.log('Admin registration failed. Please make sure the database is running.');
                } else {
                  console.log('Admin registration successful. Login with the user admin@tatool-web.com and change the password immediately.');
                }
              });
            }
          }); 
        } else {
          // update admin user
          adminAccount.roles = ['user', 'admin'];
          adminAccount.save(function(err) {
            if (err) {
              console.log('Admin registration failed. Please make sure the database is running.');
            } else {
              console.log('Admin registration successful. Login with the user admin@tatool-web.com and change the password immediately.');
            }
          });
        }

      });
      
    }
  });
};

// initialize userCode counter at startup
exports.initCounter = function(callback) {
  Counter.findById('userCode', function(err, counter) {
    if (err) {
      console.log('Failed to initialize Counter. Make sure the database is running.');
    } else {
      if (!counter) {
        counter = new Counter();
        counter._id = 'userCode';
        counter.next = 10000;
        counter.save(function(err) {
          if (err) {
            console.log('Failed to initialize Counter. Make sure the database is running.');
          } else {
            callback();
          }
        });
      } else {
        callback();
      }
    }
  });
};

// email processing
function sendVerificationEmail(options, done) {
  // send via postmark
  if (process.env.POSTMARK_API_KEY) {
    var deliver = function (textBody, htmlBody) {
        postmark.send({
            'From': process.env.SENDER_EMAIL,
            'To': options.email,
            'Subject': options.subject,
            'TextBody': textBody,
            'HtmlBody': htmlBody
        }, done);
    };
    ejs.renderFile('views/' + options.template + '.txt', options, function (err, textBody) {
        if (err) return done(err);
        ejs.renderFile('views/' + options.template + '.html', options, function (err, htmlBody) {
            if (err) return done(err);
            deliver(textBody, htmlBody)
        });
    });
  } else {
    // send via nodemailer (SMTP setup using GMAIL)
    var transporter = nodemailer.createTransport({
      debug: true,
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PW
      }
    });

    var deliver = function(textBody) {
      transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: options.email,
        subject: options.subject,
        text: textBody
      }, done);
    };

    ejs.renderFile('views/' + options.template + '.txt', options, function (err, textBody) {
        if (err) return done(err);
        deliver(textBody);
    });

  }
    
}