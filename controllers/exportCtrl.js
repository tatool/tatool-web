var fs = require('fs');
var mkdirp = require("mkdirp");
var LZString = require("lz-string");
var request = require('request');

// redirect to remote upload if configured
exports.createFile = function(req, module, mode, res) {
  if (req.app.get('remote_url')) {
    var data = { 'trialData': req.body.trialData, 'moduleId': req.params.moduleId, 'sessionId': req.params.sessionId, 'userId': req.user.email };

    var options = {
      uri: req.app.get('remote_url'),
      method: 'POST',
      json: data
    };
    request(options)
          .auth(req.app.get('resource_user'), req.app.get('resource_pw'), true)
            .pipe(res);
  } else {
    exports.createLocalFile(req, module, mode, res);
  }
};

// local file creator of exported trial data
exports.createLocalFile = function(req, module, mode, res) {
  var moduleLabel = (module.moduleLabel) ? module.moduleLabel : module.moduleId;
  var filename = module.email + '_' + moduleLabel + '_' + ('000000'+ req.params.sessionId).slice(-6);
  var extension = '.csv';

  if (!req.body.target) {
    uploadPath = 'uploads/' + mode + '/' + module.moduleId + '/';
  } else {
    uploadPath = req.body.target;
  }

  mkdirp(uploadPath, function (err) {
    if (err) {
      return res.status(500).json(err);
    } else {
      fs.exists(uploadPath + filename + extension, function(exists) {
        var timestamp = '';
        if (exists) {
          timestamp = '_' + new Date().getTime();
        }

        var decompressed = LZString.decompressFromBase64(req.body.trialData);

        fs.writeFile(uploadPath + filename + timestamp + extension, decompressed, function (err) {
          if (err) {
            return res.status(500).json(err);
          } else {
            res.json({ message: 'Trials successfully uploaded.' });
          }
        });
      });
    }
  });
}