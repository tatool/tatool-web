var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
 
var Repository = new Schema({
    email: {
      type: String,
      required: true
    },
    moduleId: {
      type: String,
      required: true
    },
    moduleType: {
      type: String,
      required: true
    },
    moduleName: {
      type: String,
      required: false
    },
    moduleAuthor: {
      type: String,
      required: false
    },
    moduleVersion: {
      type: String,
      required: false
    },
    moduleDefinition: {
      type: Schema.Types.Mixed,
      required: true
    },
    created_at: {
      type: Date,
      required: true
    },
    updated_at: {
      type: Date,
      required: true
    }
}, { minimize: false });
 
module.exports = mongoose.model( 'Repository', Repository );