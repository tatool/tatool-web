var Module = require('../models/module').userModule;
var DevModule = require('../models/module').developerModule;
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');
var Q = require('q');
const {
	Storage
} = require('@google-cloud/storage');
const storage = new Storage();
const gcsUrl = 'https://storage.googleapis.com/';


exports.getResource = function(req, res) {

	const projectsPathType = req.app.get('projects_path_type');
	const projectsPath = req.app.get('projects_path');

	var moduleModel = req.path.startsWith('/developer') ? DevModule : Module;

	moduleModel.find({
		sessionToken: req.query.token
	}, {}, {
		limit: 1
	}, function(err, modules) {
		if (err) {
			res.status(500).send(err);
		} else if (modules.length === 1) {

			switch (projectsPathType) {
				case 'local':
					getLocalResource(req, res, module, projectsPath);
					break;
				case 'gcs':
					getGCSResource(req, res, module, projectsPath);
					break;
				case 'legacy':
					getLegacyResource(req, res, module, projectsPath);
					break;
				default:
					res.status(404).json({
						message: 'PROJECTS_PATH_TYPE not set. Resource not found.'
					});
			}
		} else {
			res.status(404).json({
				message: 'Resource not found.'
			});
		}
	});

};


exports.getResourceToken = function(req, res) {
	var moduleModel = req.path.startsWith('/developer') ? DevModule : Module;

	moduleModel.findOne({
		email: req.user.email,
		moduleId: req.params.moduleId
	}, function(err, module) {
		if (err) {
			res.status(500).send(err);
		} else {

			crypto.randomBytes(Math.ceil(8 * 3 / 4), function(ex, buf) {
				var random = buf.toString('base64')
					.slice(0, 8)
					.replace(/\+/g, '0')
					.replace(/\//g, '0');
				random += new Date().getTime();

				module.sessionToken = random;

				module.save(function(err, data) {
					if (err) {
						res.status(500).send(err);
					} else {
						res.json({
							token: random
						});
					}
				});
			});
		}
	});
};


function getLocalResource(req, res, module, projectsPath) {
	var accessType = req.params.projectAccess;
	if (req.params.projectAccess === 'private') {
		accessType = req.params.projectAccess + '/' + module.created_by;
	}

	var file = projectsPath + accessType + '/' + req.params.projectName + '/' + req.params.resourceType + '/' + req.params.resourceName;
	fs.exists(file, function(exists) {
		if (exists) {
			res.download(file);
		} else {
			res.status(404).json({
				message: 'Resource not found.'
			});
		}
	});
}


function getGCSResource(req, res, module, projectsPath) {
	const bucket = storage.bucket(projectsPath);

	var accessType = (req.params.projectAccess === 'private') ? req.params.projectAccess + '/' + module[0].created_by : req.params.projectAccess;

	if (req.params.projectAccess === 'private') {
		var file = 'projects/' + accessType + '/' + req.params.projectName + '/' + req.params.resourceType + '/' + req.params.resourceName;
		var remoteFile = bucket.file(file);

		remoteFile.createReadStream({
				validation: false
			})
			.on('error', function(err) {
				res.status(404).json({
					message: err
				});
			})
			.on('response', (streamResponse) => {
				res.setHeader('Content-Type', streamResponse.headers['content-type']);
				res.setHeader('Cache-Control', 'public, max-age=3600')
			})
			.pipe(res);

	} else {
		var file = '/projects/' + accessType + '/' + req.params.projectName + '/' + req.params.resourceType + '/' + req.params.resourceName;
		var remoteFile = bucket.file(file);
		request(gcsUrl + bucket.name + file)
			.pipe(res);
	}

	/* signed url 
	const config = {
  		action: 'read',
  		expires: '03-17-2025'
		};

	remoteFile.getSignedUrl(config, function(err, url) {
		if (err) {
			console.error(err);
			return;
		}
		request(url).pipe(res);
	});
	*/

}


/*
	Will be deprecated, only used to allow migration from Legacy (PHP remote) solution to GCS.
*/
function getLegacyResource(req, res, module, projectsPath) {
	var accessType = req.params.projectAccess;
	if (req.params.projectAccess === 'private') {
		accessType = req.params.projectAccess + '/' + module.created_by;
	}

	request(projectsPath + accessType + '/' + req.params.projectName + '/' + req.params.resourceType + '/' + req.params.resourceName)
		.auth(req.app.get('resource_user'), req.app.get('resource_pw'), true)
		.pipe(res);
}