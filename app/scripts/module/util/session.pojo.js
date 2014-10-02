var Session = function(sessionId, sessionStartTime) {
  this.sessionId = sessionId;
  this.startTime = sessionStartTime;
  this.endTime = null;
  this.sessionComplete = false;
  this.maxTrialId = 0;
  this.sessionProperties = {};
};

// set the session end time
Session.prototype.setSessionEndTime = function(sessionEndTime) {
  this.endTime = sessionEndTime;
};

// mark the session as complete
Session.prototype.setSessionComplete  = function() {
  this.sessionComplete = true;
};

// set a session property (key and value)
Session.prototype.setProperty = function(propertyKey, propertyValue) {
  this.sessionProperties[propertyKey] = propertyValue;
};

// get a session property by key
Session.prototype.getProperty = function(propertyKey) {
  return this.sessionProperties[propertyKey];
};

Session.prototype.getNextTrialId = function() {
  return ++this.maxTrialId;
}

Session.prototype.getMaxTrialId = function() {
  return this.maxTrialId;
}