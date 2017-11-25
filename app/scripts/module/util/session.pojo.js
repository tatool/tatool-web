'use strict';
/*jshint -W079 */
var Session = function(sessionId, sessionStartTime) {
  /*jshint +W079 */
  this.sessionId = sessionId;
  this.startTime = sessionStartTime;
  this.endTime = null;
  this.sessionToken = null;
  this.sessionCondition = '';
  this.sessionComplete = false;
  this.maxTrialId = 0;
  this.sessionProperties = {};
};

// set the session end time
Session.prototype.setSessionEndTime = function(sessionEndTime) {
  this.endTime = sessionEndTime;
};

// set the session token
Session.prototype.setSessionToken = function(token) {
  this.sessionToken = token;
};

// get the sessionToken
Session.prototype.getSessionToken = function() {
  return this.sessionToken;
};

// set the session condition
Session.prototype.setSessionCondition = function(condition) {
  this.sessionCondition = condition;
};

// get the session condition
Session.prototype.getSessionCondition = function() {
  return this.sessionCondition;
};

// mark the session as complete
Session.prototype.setSessionComplete  = function() {
  this.sessionComplete = true;
};

// set a session property (element, key and value)
Session.prototype.setProperty = function(name, propertyKey, propertyValue) {
  if (this.sessionProperties[name] === undefined) {
    this.sessionProperties[name] = {};
    this.sessionProperties[name][propertyKey] = propertyValue;
  } else {
    this.sessionProperties[name][propertyKey] = propertyValue;
  }
};

// get a session property by element and key
Session.prototype.getProperty = function(name, propertyKey) {
  if (this.sessionProperties[name] === undefined) {
    return undefined;
  } else {
    return this.sessionProperties[name][propertyKey];
  }
};

Session.prototype.getNextTrialId = function() {
  return ++this.maxTrialId;
};

Session.prototype.getMaxTrialId = function() {
  return this.maxTrialId;
};

Session.prototype.getProperties = function() {
  return this.sessionProperties;
};

export default Session;