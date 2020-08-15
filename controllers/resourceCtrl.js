var Module = require('../models/module').userModule;
var DevModule = require('../models/module').developerModule;
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');
var Q = require('q');
var archiver = require('archiver');
var mkdirp = require("mkdirp");
var LZString = require("lz-string");
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


exports.setResource = function(req, module, mode, res) {
	const privatePathType = req.app.get('private_path_type');
	const privatePath = req.app.get('private_path');

	switch (privatePathType) {
		case 'local':
			setLocalResource(req, res, module, privatePath, mode);
			break;
		case 'gcs':
			setGCSResource(req, res, module, privatePath, mode);
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


function setLocalResource(req, res, module, privatePath, mode) {
	var moduleLabel = (module.moduleLabel) ? module.moduleLabel : module.moduleId;
	var filename = moduleLabel + '_' + req.user.code;
	var zipFilename = module.moduleId + '_' + req.user.code;
	var sessionId = '_' + ('000000' + req.params.sessionId).slice(-6);
	var extension = '.csv';
	var zipExtension = '.zip';

	if (!req.body.target || !req.app.get('override_upload_dir')) {
		uploadPath = 'uploads/' + mode + '/' + module.moduleId + '/';
	} else {
		uploadPath = req.body.target;
	}

	mkdirp(uploadPath, function(err) {
		if (err) {
			return res.status(500).json(err);
		} else {
			fs.exists(uploadPath + filename + sessionId + extension, function(exists) {
				var timestamp = '';
				if (exists) {
					timestamp = '_' + new Date().getTime();
				}

				var decompressed = LZString.decompressFromBase64(req.body.trialData);

				fs.writeFile(uploadPath + filename + sessionId + timestamp + extension, decompressed, function(err) {
					if (err) {
						return res.status(500).json(err);
					} else {
						var output = fs.createWriteStream(uploadPath + zipFilename + zipExtension, {
							'flags': 'w'
						});
						var zip = archiver('zip');
						zip.pipe(output);

						zip.bulk([{
							src: [uploadPath + '*' + req.user.code + '*.csv'],
							dest: '',
							expand: true,
							flatten: true
						}]).finalize();

						// currently node-archive doesn't support appending to an existing zip
						// https://github.com/archiverjs/node-archiver/issues/23
						//var csvFile = filename + sessionId + timestamp + extension;
						//zip.append(fs.createReadStream(uploadPath + csvFile), { name: csvFile }).finalize();

						output.on('close', function() {
							res.json({
								message: 'Trials successfully uploaded.'
							});
						});

						zip.on('error', function(err) {
							return res.status(500).json(err);
						});

					}
				});
			});
		}
	});
}


function setGCSResource(req, res, module, privatePath, mode) {
	const bucket = storage.bucket(privatePath);

	var moduleLabel = (module.moduleLabel) ? module.moduleLabel : module.moduleId;
	var sessionId = '_' + ('000000' + req.params.sessionId).slice(-6);
	var filename = moduleLabel + '_' + req.user.code + sessionId + '_' + new Date().getTime() + '.csv';

	var filePath = 'uploads/' + module.moduleId + '/' + filename;
	var remoteFile = bucket.file(filePath);
	var data = LZString.decompressFromBase64(req.body.trialData);

	const metadata = {
		contentType: 'application/CSV' //application/octet-stream
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


exports.getUserData = function(req, res, moduleId, userCode) {

	const privatePathType = req.app.get('private_path_type');
	const privatePath = req.app.get('private_path');

	const prefix = 'uploads/' + moduleId + '/';


  	res.setHeader('Content-Type', 'application/zip');
	res.setHeader('Content-Disposition', 'attachment; filename=myFile.zip');

	listFilesByPrefix(privatePath, prefix).then(function(files) {
		var archive = archiver('zip');
		archive.pipe(res);

		files.forEach(file => {
			var remoteFile = bucket.file(file.name);
			var path = file.name.split("/");
			var targetFileName = path.pop();
			archive.append(remoteFile.createReadStream({validation: false}), { name: targetFileName });
  		});
  		
		archive.finalize();

	});

}

async function listFilesByPrefix(bucketName, prefix) {
  /**
   * This can be used to list all blobs in a "folder", e.g. "public/".
   *
   * The delimiter argument can be used to restrict the results to only the
   * "files" in the given "folder". Without the delimiter, the entire tree under
   * the prefix is returned. For example, given these blobs:
   *
   *   /a/1.txt
   *   /a/b/2.txt
   *
   * If you just specify prefix = '/a', you'll get back:
   *
   *   /a/1.txt
   *   /a/b/2.txt
   *
   * However, if you specify prefix='/a' and delimiter='/', you'll get back:
   *
   *   /a/1.txt
   */

  const options = {
    prefix: prefix
  };

  // Lists files in the bucket, filtered by a prefix
  const [files] = await storage.bucket(bucketName).getFiles(options);

  return files;
}


/*	
	TO BE DEPRECATED - use local or gcs type
	Used to allow migration from Legacy (PHP remote) solution to GCS/Local.
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