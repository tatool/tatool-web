var Project = require('../models/project');

exports.getProjects = function(req, res) {
  Project.find( { $or: [ { access: 'public' }, { access: 'private', email: req.user.email } ] }, function(err, projects) {
    if (err) {
      res.status(500).json({message: 'Error reading projects.'});
    } else {
      res.json(projects);
    }
  });
};