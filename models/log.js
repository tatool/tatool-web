var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

// Log Schema
var Log = new Schema({
    email: { 
      type: String,
      required: true
    },
    modules: { 
      type: Schema.Types.Mixed,
      required: false
    },
}, { usePushEach: true });
 

// define different collections using the same Module model
module.exports.moduleLog = mongoose.model( 'log', Log );