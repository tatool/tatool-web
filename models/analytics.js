var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var Analytics = new mongoose.Schema({
    moduleId: {         // automatically assigned with pattern [email][timestamp]
      type: String,
      required: true
    },
    moduleName: {       // user defined name for module to be displayed
      type: String,
      required: true
    },
    moduleLabel: {     // user defined label of module (used for filenames etc)
      type: String,
      required: false
    },
    created_by: {       // owner of module will be set at time of creation and can't be changed
      type: String,
      required: true
    },
    created_at: {       // owner of module will be set at time of creation and can't be changed
      type: Date,
      required: true
    },
    email: {            // account where module is installed (not necessarily the owner and not present in repository)
      type: [],
      required: false
    },
    userData: {
      type: [],
      required: false
    }
}, { usePushEach: true });

module.exports = mongoose.model( 'Analytics', Analytics );