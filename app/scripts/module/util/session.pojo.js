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
}

Session.prototype.getMaxTrialId = function() {
  return this.maxTrialId;
}