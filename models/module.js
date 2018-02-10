var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

// Constants used in data model
var constants = {
  MODULE_STATUS_READY : 'ready',
  MODULE_STATUS_INVITE : 'invite',
  MODULE_STATUS_LOCK : 'lock',
  MODULE_TYPE_PRIVATE : 'private',
  MODULE_TYPE_PUBLIC : 'public'
};
 
// Module Schema
var Module = new Schema({
  
    // USER DEFINED FIELDS
    moduleName: {       // user defined name for module to be displayed
      type: String,
      required: true
    },
    moduleDefinition: { // module hierarchy which makes up the module
      type: Schema.Types.Mixed,
      required: true
    },
    moduleLabel: {     // user defined label of module (used for filenames etc)
      type: String,
      required: false
    },
    moduleAuthor: {     // user defined name of author to be displayed
      type: String,
      required: false
    },
    moduleIcon: {       // custom icon of module to be displayed
      type: String,
      required: false
    },
    moduleDescription: { // description of module
      type: String,
      required: false
    },
    moduleMaxSessions: { // maximum number of sessions per user
      type: Number,
      required: false
    },
    exportDelimiter: { // export delimiter for module
      type: String,
      required: false
    },
    exportFormat: { // export format for module
      type: String,
      required: false
    },
    invites: {          // defines details for private repository module (invite, users)
      type: Schema.Types.Mixed,
      required: false    
    },


    // TECHNICAL FIELDS
    email: {            // account where module is installed (not necessarily the owner and not present in repository)
      type: String,
      required: true
    },
    moduleId: {         // automatically assigned with pattern [email][timestamp]
      type: String,
      required: true
    },
    moduleVersion: {    // current module version
      type: String,
      required: true
    },
    publishedModuleVersion: {    // currently published module version
      type: String,
      required: true
    },
    sessionToken: {     // session token used to access resources
      type: String,
      required: false
    },
    lastSessionToken: { // previsou session token assigned to module
      type: String,
      required: false
    },
    created_by: {       // owner of module will be set at time of creation and can't be changed
      type: String,
      required: true
    },
    created_at: {       // datetime of module creation (developer mode)
      type: Date,
      required: true
    },
    updated_at: {       // datetime of update to module (developer AND user mode)
      type: Date,
      required: true
    },
    moduleStatus: {     // status of module could be 'ready', 'invite', 'lock'
      type: String,
      required: true
    },
    moduleType: {       // added in repository to identify 'public' or 'private' modules
      type: String,
      required: false
    },

    // RUNTIME INFORMATION
    moduleProperties: { // module user data
      type: Schema.Types.Mixed,
      required: false
    },
    maxSessionId: {     // max session id of this module
      type: Number,
      required: false
    },
    sessions: {         // session user data
      type: Schema.Types.Mixed,
      required: false
    },
}, { minimize: false, usePushEach: true });
 

// define different collections using the same Module model
module.exports.userModule = mongoose.model( 'usermodule', Module );

module.exports.developerModule = mongoose.model( 'developermodule', Module );

module.exports.repositoryModule = mongoose.model( 'repositorymodule', Module );

module.exports.constants = constants;
