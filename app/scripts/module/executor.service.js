'use strict';

ExecutorService.$inject = ['$log', '$location', '$q', '$state', '$timeout', '$injector', '$window', 'moduleService', 'elementStackService', 'utilService', 'executionPhaseService', 'trialService', 'contextService', 'timerUtils', 'tatoolPhase', 'cfgModule', 'executableService'];

function ExecutorService($log, $location, $q, $state, $timeout, $injector, $window, moduleService, elementStackService, utilService, executionPhaseService, trialService, contextService, timerUtils, tatoolPhase, cfgModule, executableService) {
    $log.debug('Executor: initialized');

    var obj = {currentSessionId: 0, blankInterval: 0, blankIntervalScreen: '', fixationInterval: 0, fixationIntervalScreen: ''};

    var blankIntervalPromise;

    var fixationIntervalPromise;

    // Start a new module by initializing the elementStack, create a new session, and then run the top element
    obj.startModule = function(){
      // create new session
      obj.currentSessionId = moduleService.createSession();
      var extCondition = $window.sessionStorage.getItem('extCondition');
      moduleService.setSessionCondition(extCondition);
      $window.sessionStorage.removeItem('extCondition');

      // saving the module back to make sure the new session is registered in case of an error
      moduleService.saveModule().then(function() {
        initializeModule();
      });
    };

    var initializeModule = function() {
      obj.continueModule = true;

      // initialize the stack
      elementStackService.initialize(obj, moduleService.getModuleDefinition()).then(function() {
        // run init method on all executables
        executableService.initAllExecutables().then(function() {
          moduleLoaded(); // inform tatool app that loading has finished
          runModule();
        }, function(error) {
          $log.error(error);
          obj.stopModule(false, error);
        });
      }, function(error) {
        $log.error(error);
        obj.stopModule(false, error);
      });
    };

    var runModule = function() {
      // trigger phase change
      broadcastPhaseChange(tatoolPhase.SESSION_START, elementStackService.stack);

      // start running root element
      runElement();
    };

    // Stop a module and return to home 
    obj.stopModule = function(sessionComplete, error) {
      $log.debug('Stop Module');

      // make sure we cancel all timers initiated by the executor
      $timeout.cancel(blankIntervalPromise);
      $timeout.cancel(fixationIntervalPromise);

      // stop and remove all timers
      timerUtils.clearAllTimers();

      // closing the open session
      if (obj.currentSessionId !== 0) {
        moduleService.setSessionEndTime(utilService.getCurrentDate());
        if (sessionComplete) {
          moduleService.setSessionComplete();
        }
      }

      broadcastPhaseChange(tatoolPhase.SESSION_END);

      // save module information and return home
      try{
        moduleService.saveModule().then(function() {
          exitModule(error);
        });
      } catch(exception) {
        exitModule(exception);
      }
    };

    function moduleLoaded() {
      parent.postMessage({ type: 'moduleLoaded', errorMessage: '' }, '*');
    }

    function exitModule(error) {
      parent.postMessage({ type: 'moduleExit', errorMessage: error }, '*');
    }

    // Updating the elementStack by processing Executables or Selectors
    var updateElementStack = function(){
      var x = 0;

      while (x < 100) {
        if (elementStackService.stack.peek().tatoolType === 'Executable') {
          return true;
        } else if (runSelector()) {
          continue;
        } else {
          elementStackService.stack.pop();
          if (elementStackService.stack.getCount() === 0) {
            return false;
          }
        }
      }
    };

    // Run selector of current element
    var runSelector = function() {
      var iteratorObj = elementStackService.stack.peek().iterator;
      if (iteratorObj) {
        return iteratorObj.selectNextElement(elementStackService.stack, moduleService.getSessionCondition());
      } else {
        return false;
      }
    };

    // Run element as long as elementStack is not empty
    var runElement = function() {
      obj.continueModule = updateElementStack();

      contextService.setProperty('elementStack', elementStackService.stack.displayAll());
      contextService.setProperty('currentExecutable', elementStackService.stack.peek());

      if (obj.continueModule) {
        // create execution deferred to continue running the runElement method as soon as its promise is resolved by an Executable
        var currentExecutable = elementStackService.stack.peek();

        obj.exec = $q.defer();
        obj.exec.promise.then(
          function() {
            if (obj.blankInterval > 0) {
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
      var statusEnabled = currentExecutable.status ? true : false;
      $state.go('module', {moduleId: moduleService.getModuleId(), type: 'custom', url: obj.blankIntervalScreen, status: statusEnabled }, {location: false});
      blankIntervalPromise = $timeout(function() {return true;}, obj.blankInterval);
      return blankIntervalPromise;
    };

    // runs the fixation interval screen for a given amount of time
    var runFixationInterval = function(currentExecutable) {
      var statusEnabled = currentExecutable.status ? true : false;
      $state.go('module', {moduleId: moduleService.getModuleId(), type: 'custom', url: obj.fixationIntervalScreen, status: statusEnabled }, {location: false});
      fixationIntervalPromise = $timeout(function() {return true;}, obj.fixationInterval);
      return fixationIntervalPromise;
    };

    // preprocess the executable
    var preprocessExecutable = function(currentExecutable) {
    
      // set the current blankInterval
      if ('blankInterval' in currentExecutable && currentExecutable.blankInterval !== '') {
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
      if ('fixationInterval' in currentExecutable && currentExecutable.fixationInterval !== '') {
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
      if (obj.fixationInterval > 0) {
        runFixationInterval(currentExecutable).then(function() { runExecutable(currentExecutable);});
      } else {
        runExecutable(currentExecutable);
      }
    };

    // Run executable by accessing the specific Controller/View
    // In order to initialize the Controller if the state has not changed, we force a reload
    var runExecutable = function(currentExecutable) {
      broadcastPhaseChange(tatoolPhase.EXECUTABLE_START, elementStackService.stack);

      var url = 'executables/' + currentExecutable.customType + '.html';

      // check for status panel settings
      var statusEnabled = false;
      angular.forEach(currentExecutable.status, function(panelValue) {
        if (panelValue) {
          statusEnabled = panelValue;
        }
      });
      var params = { moduleId: moduleService.getModuleId(), type: 'executable', url: url, status: statusEnabled };

      // trigger mouse cursor visibility
      var hideMouseCursor = (currentExecutable.hideMouseCursor) ? currentExecutable.hideMouseCursor : false;
      broadcastPhaseChange(tatoolPhase.MOUSE_CURSOR, hideMouseCursor);

      // focus window to make sure we're receiving user input
      $window.focus();
      
      if ($state.is('module', params)) {
        $state.reload();
      } else {
        $state.go('module', params, {location: false});
      }
    };

    // Used to signal the executor that it can continue running through the elementStack
    obj.stopExecutable = function() {
      if (this.exec) {
        var currentExecutable = contextService.getProperty('currentExecutable');
        currentExecutable.dual = null;

        this.finishExecutable();

        // inform the executor that the execution should continue with the next element
        this.exec.resolve();
      } else {
        $log.error('ERROR: Call to stopExecutable failed.');
        obj.stopModule(false);
      }
    };

    // Used to signal the executor that it can continue running through the elementStack
    obj.suspendExecutable = function() {
      if (this.exec) {
        var currentExecutable = contextService.getProperty('currentExecutable');
        currentExecutable.dual = 'SUSPENDED';

        this.finishExecutable();
        // inform the executor that the execution should continue with the next element
        this.exec.resolve();
      } else {
        $log.error('ERROR: Call to suspendExecutable failed.');
        obj.stopModule(false);
      }
    };

    // Used to signal the executor that the current executable has failed and module should be stopped
    obj.failExecutable = function(error) {
      if (this.exec) {
        this.finishExecutable();

        obj.stopModule(false, error);
      } else {
        $log.error('ERROR: Call to failExecutable failed.');
        obj.stopModule(false, error);
      }
    };

    // Used to signal the executor that the current executable should be finished
    obj.finishExecutable = function() {
      // broadcast the phase EXECUTABLE_END
      broadcastPhaseChange(tatoolPhase.EXECUTABLE_END, elementStackService.stack);

      // cancel executable timers
      timerUtils.cancelExecutableTimers(elementStackService.stack.peek().name);
        
      // remove current executable from elementStack
      elementStackService.stack.pop();

      // remove all trials from temporary trialService object
      trialService.clearCurrentTrials();
    };

    // inform the executionPhaseListener of any phase changes
    var broadcastPhaseChange = function(executionPhase, stack) {
      executionPhaseService.broadcastPhase(executionPhase, stack);
    };

    return obj;
}

export default ExecutorService;
