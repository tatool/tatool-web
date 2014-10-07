'use strict';

angular.module('tatool.module')
  .factory('executor', ['$log', '$location', '$q', '$state', '$timeout', '$injector', '$window', 'moduleService', 'elementStack', 'util', 'executionPhaseService', 'trialService', 'contextService', 'timerService', 'tatoolPhase', 'cfgModule',
    function ($log, $location, $q, $state, $timeout, $injector, $window, moduleService, elementStack, util, executionPhaseService, trialService, contextService, timerService, tatoolPhase, cfgModule) {
    $log.debug('Executor: initialized');

    var obj = {currentSessionId: 0, blankInterval: 0, blankIntervalScreen: '', fixationInterval: 0, fixationIntervalScreen: ''};

    var blankIntervalPromise;

    var fixationIntervalPromise;

    // Start a new module by initializing the elementStack, create a new session, and then run the top element
    obj.startModule = function(){
      // create new session
      obj.currentSessionId = moduleService.createSession();

      obj.continueModule = true;

      // initialize the stack
      elementStack.initialize(obj, moduleService.getModuleDefinition());

      // saving the module back to make sure the new session is registered in case of an error
      moduleService.saveModule();

      broadcastPhaseChange(tatoolPhase.SESSION_START, elementStack.stack);
      runElement();
    };

    // Stop a module and return to home 
    obj.stopModule = function(sessionComplete) {
      $log.debug('Stop Module');

      // make sure we cancel all timers initiated by the executor
      $timeout.cancel(blankIntervalPromise);
      $timeout.cancel(fixationIntervalPromise);

      // stop and remove all timers
      timerService.clearAllTimers();

      // closing the open session
      if (obj.currentSessionId !== 0) {
        moduleService.setSessionEndTime(util.getDateTime());
        if (sessionComplete) {
          moduleService.setSessionComplete();
        }
      }

      broadcastPhaseChange(tatoolPhase.SESSION_END);

      // save module information and return home
      try{
        moduleService.saveModule().then(exitModule);
      } catch(exception) {
        exitModule();
      }
    };

    function exitModule() {
      $window.location = '../../index.html';
    }

    // Updating the elementStack by processing Executables or Selectors
    var updateElementStack = function(){
      var x = 0;

      while (x < 100) {
        if (elementStack.stack.peek().tatoolType === 'Executable') {
          return true;
        } else if (runSelector()) {
          continue;
        } else {
          elementStack.stack.pop();
          if (elementStack.stack.getCount() === 0) {
            return false;
          }
        }
      }
    };

    // Run selector of current element
    var runSelector = function() {
      var iteratorObj = elementStack.stack.peek().iterator;
      if (iteratorObj) {
        return iteratorObj.selectNextElement(elementStack.stack);
      } else {
        return false;
      }
    };

    // Run element as long as elementStack is not empty
    var runElement = function() {
      obj.continueModule = updateElementStack();

      contextService.setProperty('elementStack', elementStack.stack.displayAll());
      contextService.setProperty('currentExecutable', elementStack.stack.peek());

      if (obj.continueModule) {
        // create execution deferred to continue running the runElement method as soon as its promise is resolved by an Executable
        var currentExecutable = elementStack.stack.peek();

        obj.exec = $q.defer();
        obj.exec.promise.then(
          function() {
            if (obj.blankInterval !== 0) {
              runBlankInterval(currentExecutable).then(runElement);
            } else {
              runElement();
            }
          });
        preprocessExecutable(currentExecutable);
      } else {
        obj.stopModule(true);
      }
    };

    // runs the blank interval screen for a given amount of time
    var runBlankInterval = function(currentExecutable) {
      $state.go('module', {moduleId: moduleService.getModuleId(), type: 'custom', url: obj.blankIntervalScreen, content: currentExecutable }, {location: false});
      blankIntervalPromise = $timeout(function() {return true;}, obj.blankInterval);
      return blankIntervalPromise;
    };

    // runs the fixation interval screen for a given amount of time
    var runFixationInterval = function(currentExecutable) {
      $state.go('module', {moduleId: moduleService.getModuleId(), type: 'custom', url: obj.fixationIntervalScreen, content: currentExecutable }, {location: false});
      fixationIntervalPromise = $timeout(function() {return true;}, obj.fixationInterval);
      return fixationIntervalPromise;
    };

    // preprocess the executable
    var preprocessExecutable = function(currentExecutable) {
    
      // set the current blankInterval
      if ('blankInterval' in currentExecutable) {
        obj.blankInterval = currentExecutable.blankInterval;
      } else {
        obj.blankInterval = cfgModule.DEFAULT_BLANK_INTERVAL;
      }

      // set the current blankInterval screen
      if ('blankIntervalScreen' in currentExecutable) {
        obj.blankIntervalScreen = currentExecutable.blankIntervalScreen;
      } else {
        obj.blankIntervalScreen = cfgModule.DEFAULT_BLANK_INTERVAL_SCREEN;
      }

      // set the current fixationInterval
      if ('fixationInterval' in currentExecutable) {
        obj.fixationInterval = currentExecutable.fixationInterval;
      } else {
        obj.fixationInterval = cfgModule.DEFAULT_FIXATION_INTERVAL;
      }

      // set the current fixationInterval screen
      if ('fixationIntervalScreen' in currentExecutable) {
        obj.fixationIntervalScreen = currentExecutable.fixationIntervalScreen;
      } else {
        obj.fixationIntervalScreen = cfgModule.DEFAULT_FIXATION_INTERVAL_SCREEN;
      }

      // display fixation screen if executable is configured accordingly
      // run executable
      if (obj.fixationInterval !== 0) {
        runFixationInterval(currentExecutable).then(function() { runExecutable(currentExecutable);});
      } else {
        runExecutable(currentExecutable);
      }
    };

    // Run executable by accessing the specific Controller/View
    // In order to initialize the Controller if the state has not changed, we force a reload
    var runExecutable = function(currentExecutable) {
      broadcastPhaseChange(tatoolPhase.EXECUTABLE_START, elementStack.stack);

      var url = '';
      if (currentExecutable.customType === 'tatoolInstruction') {
        url = cfgModule.DEFAULT_INSTRUCTION_SCREEN;
      } else if (currentExecutable.customType === 'tatoolCountdown') {
        url = cfgModule.DEFAULT_COUNTDOWN_SCREEN;
      } else {
        url = currentExecutable.customType + '.html';
      }
      var params = { moduleId: moduleService.getModuleId(), type: 'executable', url: url, content: currentExecutable };

      if ($state.is('module', params)) {
        $state.forceReload();
      } else {
        $state.go('module', params, {location: false});
      }
    };

    // Used to signal the executor that it can continue running through the elementStack
    obj.stopExecutable = function() {
      if (this.exec) {
        this.abortExecutable();

        // inform the executor that the execution should continue with the next element
        this.exec.resolve('');
      } else {
        $log.error('ERROR: Call to stopExecutable failed due to not been properly initialized module. Module will be stopped.');
        obj.stopModule(false);
      }
    };

    // Used to signal the executor that the current executable has been aborted
    obj.abortExecutable = function() {
      // broadcast the phase EXECUTABLE_END
      broadcastPhaseChange(tatoolPhase.EXECUTABLE_END, elementStack.stack);

      // cancel executable timers
      timerService.cancelExecutableTimers(elementStack.stack.peek().name);
        
      // remove current executable from elementStack
      elementStack.stack.pop();

      // remove all trials from temporary trialService object
      trialService.clearCurrentTrials();
    };

    // inform the executionPhaseListener of any phase changes
    var broadcastPhaseChange = function(executionPhase, stack) {
      executionPhaseService.broadcastPhase(executionPhase, stack);
    };

    return obj;
  }]);
