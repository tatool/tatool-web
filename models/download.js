var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var DownloadToken = new mongoose.Schema({
    token: {
      type: String,
      required: true
    },
    moduleId: {
      type: String,
      required: true
    },
    userCode: {
      type: String,
      required: false
    },
    created_at: {
      type: Date,
      required: true
    },
    created_by: {
      type: String,
      required: true
    }, // DEPRECATED
    file: {
      type: String,
      required: false
    },
    fileName: {
      type: String,
      required: false
    }
});

module.exports = mongoose.model( 'DownloadToken', DownloadToken );