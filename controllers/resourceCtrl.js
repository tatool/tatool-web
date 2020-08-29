var Module = require('../models/module').userModule;
var DevModule = require('../models/module').developerModule;
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');
var Q = require('q');
var archiver = require('archiver');
var mkdirp = require("mkdirp");
var rmdir = require('rimraf');
var LZString = require("lz-string");
var glob = require("glob");

const {
	Storage
} = require('@google-cloud/storage');
const storage = new Storage();
const gcsUrl = 'https://storage.googleapis.com/';

const pathPrefix = 'uploads/user/';


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


exports.setUserData = function(req, module, mode, res) {
	const privatePathType = req.app.get('private_path_type');
	const privatePath = req.app.get('private_path');

	switch (privatePathType) {
		case 'local':
			setLocalUserData(req, res, module, privatePath, mode);
			break;
		case 'gcs':
			setGCSUserData(req, res, module, privatePath, mode);
			break;
		case 'legacy':
			//setLegacyResource(req, res, module, privatePath, mode);
			break;
		default:
			res.status(404).json({
				message: 'PROJECTS_PATH_TYPE not set. Resource not found.'
			});
	}
};

function setLocalUserData(req, res, module, privatePath, mode) {

	const sessionId = '_' + ('000000' + req.params.sessionId).slice(-6);
	const filename = 'uploads/' + mode + '/' + module.moduleId + '/' + req.user.code + sessionId + '.csv';

	if (!req.body.target || !req.app.get('override_upload_dir')) {
		uploadPath = 'uploads/' + mode + '/' + module.moduleId + '/';
	} else {
		uploadPath = req.body.target;
	}

	mkdirp(uploadPath, function(err) {
		if (err) {
			return res.status(500).json(err);
		} else {
			fs.exists(filename, function(exists) {
				const timestamp = '_' + new Date().getTime();

				var decompressed = LZString.decompressFromBase64(req.body.trialData);

				fs.writeFile(filename, decompressed, function(err) {
					if (err) {
						return res.status(500).json(err);
					} else {
						res.json({
							message: 'Trials successfully uploaded.'
						});

					}
				});
			});
		}
	});
}

function setGCSUserData(req, res, module, privatePath, mode) {
	const bucket = storage.bucket(privatePath);

	const sessionId = '_' + ('000000' + req.params.sessionId).slice(-6);
	const filename = req.user.code + sessionId + '_' + new Date().getTime() + '.csv';

	const filePath = 'uploads/' + module.moduleId + '/' + filename;
	const remoteFile = bucket.file(filePath);
	const data = LZString.decompressFromBase64(req.body.trialData);

	const metadata = {
		contentType: 'application/CSV', //application/octet-stream
		contentEncoding: 'gzip'
	};

	remoteFile.save(data, {
		resumable: false,
		metadata: metadata
	}, function(err) {
		if (!err) {
			res.json({
				message: 'Trials successfully uploaded.'
			});
		} else {
			res.status(500).json(err);
		}
	});

}


exports.getUserData = function(req, res, moduleId, userCode) {
	const privatePathType = req.app.get('private_path_type');
	const privatePath = req.app.get('private_path');

	switch (privatePathType) {
		case 'local':
			getLocalUserData(req, res, privatePath, moduleId, userCode);
			break;
		case 'gcs':
			getGCSUserData(req, res, privatePath, moduleId, userCode);
			break;
		default:
			res.status(404).json({
				message: 'PROJECTS_PATH_TYPE not set. Resource not found.'
			});
	}
}

function getLocalUserData(req, res, privatePath, moduleId, userCode) {
	const targetFilename = moduleId + ((userCode) ? '_' + userCode : '') + '.zip';

	glob(((userCode) ? userCode : '') + '*.csv', {
		cwd: pathPrefix + moduleId
	}, function(er, files) {
		if (files.length > 0) {
			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Disposition', 'attachment; filename=' + targetFilename);
			let archive = archiver('zip');
			archive.pipe(res);

			archive.glob(((userCode) ? userCode : '') + '*.csv', {
				cwd: pathPrefix + moduleId
			});
			archive.finalize();
		} else {
			res.status(500).json({
				message: 'No data available!'
			});
		}
	});
}

function getGCSUserData(req, res, privatePath, moduleId, userCode) {
	const bucket = storage.bucket(privatePath);
	const prefix = 'uploads/' + moduleId + '/' + ((userCode) ? userCode : '');
	const targetFilename = moduleId + ((userCode) ? '_' + userCode : '') + '.zip';

	listGCSFilesByPrefix(privatePath, prefix).then(function(files) {
		if (files.length > 0) {
			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Disposition', 'attachment; filename=' + targetFilename);
			let archive = archiver('zip');
			archive.pipe(res);

			files.forEach(file => {
				let remoteFile = bucket.file(file.name);
				let path = file.name.split("/");
				let targetFileName = path.pop();

				archive.append(remoteFile.createReadStream({
					validation: false
				}), {
					name: targetFileName
				});
			});
			archive.finalize();
		} else {
			res.status(500).json({
				message: 'No data available!'
			});
		}
	});
}

exports.deleteUserData = function(req, res, moduleId, userCode) {
	const privatePathType = req.app.get('private_path_type');
	const privatePath = req.app.get('private_path');

	switch (privatePathType) {
		case 'local':
			deleteLocalUserData(req, res, privatePath, moduleId, userCode);
			break;
		case 'gcs':
			deleteGCSUserData(req, res, privatePath, moduleId, userCode);
			break;
		default:
			res.status(404).json({
				message: 'PROJECTS_PATH_TYPE not set. Resource not found.'
			});
	}
}

function deleteLocalUserData(req, res, privatePath, moduleId, userCode) {
	if (userCode) {
		glob(((userCode) ? userCode : '') + '*.csv', {
			cwd: pathPrefix + moduleId
		}, function(er, files) {
			if (files.length > 0) {
				var i = files.length;
				files.forEach(function(file) {
					fs.unlink(pathPrefix + moduleId + '/' + file, function(err) {
						i--;
						if (err) {
							res.status(404).json({
								message: 'Error deleting Analytics user files.'
							});
							return;
						} else if (i <= 0) {
							res.json();
						}
					});
				});
			} else {
				res.json();
			}
		});
	} else {
		rmdir(pathPrefix + moduleId, function(error) {
			if (error) {
				res.status(500).send(err);
			} else {
				res.json();
			}
		});
	}
}

function deleteGCSUserData(req, res, privatePath, moduleId, userCode) {
	const bucket = storage.bucket(privatePath);
	const prefix = 'uploads/' + moduleId + '/' + ((userCode) ? userCode : '');

	bucket.deleteFiles({
		prefix: prefix
	}, function(err) {
		if (!err) {
			res.json();
		}
	});
}

async function listGCSFilesByPrefix(bucketName, prefix) {
	const options = {
		prefix: prefix
	};
	const [files] = await storage.bucket(bucketName).getFiles(options);

	return files;
}