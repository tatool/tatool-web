// Load required packages
var Repository = require('../models/repository');

exports.addRepositoryEntry = function(req, res) {
  var today = new Date();

  Repository.findOne({ moduleId: req.body.moduleId }, function(err, entry) {
    if (err) res.status(500).send(err);

    // add new entry
    if (!entry) {

      // Create a new entry
      entry = req.body;
      entry.email = req.user.email;
      entry.created_at = today;
      entry.updated_at = today;

      Repository.create(entry, function(err, result) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({ message: 'RepositoryEntry successfully added!', data: entry });
        }
      });
      
      // update existing entry if allowed
    } else {

      if (req.user.email === entry.email) {
        entry.updated_at = today;
        entry.moduleType = req.body.moduleType;
        entry.moduleName = req.body.moduleName;
        entry.moduleAuthor = req.body.moduleAuthor;
        entry.moduleVersion = req.body.moduleVersion;
        entry.moduleDefinition = req.body.moduleDefinition;

        entry.save(function(err, data) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json({ message: 'RepositoryEntry successfully updated!', data: entry });
          }
        });
      } else {
        res.status(500).send({ message: 'A module with this id already exists!', data: entry });
      }
    }
  });
  
};

exports.getRepositoryEntries = function(req, res) {
  Repository.find({ moduleType: 'public' }, function(err, entries) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(entries);
    }
  });
};

exports.getRepositoryEntry = function(req, res) {
  Repository.findOne({ moduleType: 'public', moduleId: req.params.moduleId }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(entry);
    }
  });
};

exports.removeRepositoryEntry = function(req, res) {

  Repository.findOne({ moduleId: req.params.moduleId }, function(err, entry) {
    if (err) res.status(500).send(err);

    if (entry) {
      if (req.user.email === entry.email) {
        Repository.remove({ email: req.user.email, moduleId: req.params.moduleId }, function(err, entry) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json(entry);
          }
        });
      } else {
        res.status(500).send({ message: 'You\'re not allowed to unpublish this module!', data: entry });
      }
    } else {
      res.status(500).send({ message: 'There is no module with this moduleId in the repository!', data: entry });
    }

  });

};