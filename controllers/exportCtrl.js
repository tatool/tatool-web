var fs = require('fs');
var mkdirp = require("mkdirp");

exports.createTrialFile = function(req, module, mode, res) {
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

        fs.writeFile(uploadPath + filename + timestamp + extension, req.body.trialData, function (err) {
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