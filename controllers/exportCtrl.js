var fs = require('fs');
var mkdirp = require("mkdirp");
var LZString = require("lz-string");
var request = require('request');
var AdmZip = require('adm-zip');

// redirect to remote upload if configured
exports.createFile = function(req, module, mode, res) {
  if (req.app.get('remote_url')) {
    var data = { 'trialData': req.body.trialData, 'moduleId': req.params.moduleId, 'sessionId': req.params.sessionId, 'userCode': req.user.code, 'moduleLabel': module.moduleLabel };

    var options = {
      uri: req.app.get('remote_url') + req.app.get('remote_upload'),
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
  var filename = moduleLabel + '_' + req.user.code;
  var zipFilename = module.moduleId + '_' + req.user.code;
  var sessionId = '_' + ('000000'+ req.params.sessionId).slice(-6);
  var extension = '.csv';
  var zipExtension = '.zip';

  if (!req.body.target || !req.app.get('override_upload_dir')) {
    uploadPath = 'uploads/' + mode + '/' + module.moduleId + '/';
  } else {
    uploadPath = req.body.target;
  }

  mkdirp(uploadPath, function (err) {
    if (err) {
      return res.status(500).json(err);
    } else {
      fs.exists(uploadPath + filename + sessionId + extension, function(exists) {
        var timestamp = '';
        if (exists) {
          timestamp = '_' + new Date().getTime();
        }

        var decompressed = LZString.decompressFromBase64(req.body.trialData);

        fs.writeFile(uploadPath + filename + sessionId + timestamp + extension, decompressed, function (err) {
          if (err) {
            return res.status(500).json(err);
          } else {

            fs.exists(uploadPath + zipFilename + zipExtension, function(exists) {
              var zip = null;
              if (!exists) {
                zip = new AdmZip();
                zip.writeZip(uploadPath + zipFilename + zipExtension);
              } else {
                zip = new AdmZip(uploadPath + zipFilename + zipExtension);
              }
              
              zip.addLocalFile(uploadPath + filename + sessionId + timestamp + extension);
              zip.writeZip(uploadPath + zipFilename + zipExtension);
              
              console.log('zip', uploadPath + filename + sessionId + timestamp + extension);
              res.json({ message: 'Trials successfully uploaded.' });
            });

          }
        });
      });
    }
  });
}