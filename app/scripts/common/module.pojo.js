'use strict';
/*jshint -W079 */
var Module = function(moduleId) {
  /*jshint +W079 */
  this.moduleId = moduleId;
  this.moduleName = '';
  this.moduleLabel = '';
  this.moduleAuthor = '';
  this.moduleVersion = '';
  this.moduleProperties = {};
  this.maxSessionId = 0;
  this.moduleDefinition = {};
  this.modulePackagePath = '';
  this.sessions = {};
  this.moduleType = '';
  this.exportDelimiter = '';
  this.moduleMaxSessions = '';
};

// get the module name
Module.prototype.getName = function() {
  return this.moduleName;
};

// get the module label
Module.prototype.getLabel = function() {
  return this.moduleLabel;
};

// get the module ID
Module.prototype.getId = function() {
  return this.moduleId;
};

Module.prototype.getNextSessionId = function() {
  return ++this.maxSessionId;
};

Module.prototype.getMaxSessionId = function() {
  return this.maxSessionId;
};

Module.prototype.getAuthor = function() {
  return this.moduleAuthor;
};

Module.prototype.getVersion = function() {
  return this.moduleVersion;
};

Module.prototype.getDefinition = function() {
  return this.moduleDefinition;
};

Module.prototype.getPackagePath = function() {
  return this.modulePackagePath;
};

Module.prototype.getModuleType = function() {
  return this.moduleType;
};

Module.prototype.getExportFormat = function() {
  return this.exportFormat;
};

Module.prototype.getModuleMaxSessions = function() {
  return this.maxSessions;
};

// sets the module name
Module.prototype.setModuleName = function(moduleName) {
  this.moduleName = moduleName;
};

// sets the module label
Module.prototype.setModuleLabel = function(moduleLabel) {
  this.moduleLabel = moduleLabel;
};

// sets the module author
Module.prototype.setModuleAuthor = function(moduleAuthor) {
  this.moduleAuthor = moduleAuthor;
};

// sets the module version
Module.prototype.setModuleVersion = function(moduleVersion) {
  this.moduleVersion = moduleVersion;
};

// sets the module definition (json module file)
Module.prototype.setModuleDefinition = function(moduleDefinition) {
  this.moduleDefinition = moduleDefinition;
};

// sets the module label
Module.prototype.setModuleDescription = function(moduleDescription) {
  this.moduleDescription = moduleDescription;
};

// sets the module package url
Module.prototype.setModulePackagePath = function(packagePath) {
  this.modulePackagePath = packagePath;
};

Module.prototype.setModuleType = function(moduleType) {
  this.moduleType = moduleType;
};

Module.prototype.setExportDelimiter = function(exportDelimiter) {
  this.exportDelimiter = exportDelimiter;
};

Module.prototype.setExportFormat = function(exportFormat) {
  this.exportFormat = exportFormat;
};

Module.prototype.setModuleMaxSessions = function(maxSessions) {
  this.moduleMaxSessions = maxSessions;
};

// add a session to this module
Module.prototype.addSession = function(session) {
  this.sessions[session.sessionId] = session;
};

Module.prototype.getSession = function(sessionId) {
  return this.sessions[sessionId];
};

// set a module property (key and value)
Module.prototype.setProperty = function(name, propertyKey, propertyValue) {
  if (this.moduleProperties[name] === undefined) {
    this.moduleProperties[name] = {};
    this.moduleProperties[name][propertyKey] = propertyValue;
  } else {
    this.moduleProperties[name][propertyKey] = propertyValue;
  }
};

// get a module property by key
Module.prototype.getProperty = function(name, propertyKey) {
  if (this.moduleProperties[name] === undefined) {
    return undefined;
  } else {
    return this.moduleProperties[name][propertyKey];
  }
};

// get all module properties
Module.prototype.getProperties = function() {
  return this.moduleProperties;
};

export default Module;