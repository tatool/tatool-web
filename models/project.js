var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var Project = new mongoose.Schema({
    _id: String,
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
      required: true
    },
    executables: {
      type: [],
      required: false
    },
});


module.exports = mongoose.model( 'Project', Project );