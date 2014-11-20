// Load dependencies
var User = require('../models/user');
var simple_recaptcha = require('simple-recaptcha');
var uuid = require('node-uuid');
var postmark = require("postmark")(process.env.POSTMARK_API_KEY);
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var ejs = require("ejs");

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
      user.verified = false;
      user.token = uuid.v4();
      user.updated_at = new Date();

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
              res.json({ message: 'User successfully added to the db!', data: user });
            }
          });
        }
      });

    } else {
      res.status(500).json({ message: 'The email address is already registered.' });
    }
  });
};

exports.verifyCaptcha = function(req, res) {
  var privateKey = process.env.RECAPTCHA_PRIVATE_KEY;
  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;

  simple_recaptcha(privateKey, ip, challenge, response, function(err) {
    if (err) {
      res.status(500).json({ message: 'Captcha verification failed. Refresh  the captcha by clicking on the button right next to the Captcha to try again.', data: err });
    } else {
      res.json('verified');
    }
  });
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
          res.json({ message: 'User successfully updated!', data: user });
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
      email: 'info@tatool.ch',
      name: 'info@tatool.ch',
      subject: 'Developer Signup',
      template: 'developer-signup-email',
      user: req.body.email
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


// email processing
function sendVerificationEmail(options, done) {
  // send via postmark
  if (process.env.POSTMARK_API_KEY) {
    var deliver = function (textBody, htmlBody) {
        postmark.send({
            'From': 'tatool-web@tatool.ch',
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
        from: 'tatool-web@tatool.ch',
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