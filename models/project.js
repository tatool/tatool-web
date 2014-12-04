var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var Project = new mongoose.Schema({
    access: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: false
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    executables: {
      type: [],
      required: false
    },
});


module.exports = mongoose.model( 'Project', Project );