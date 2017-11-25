'use strict';

ElementStackService.$inject = ['$log', '$injector', '$q', '$window', 'handlerService', 'executableService'];

function ElementStackService($log, $injector, $q, $window, handlerService, executableService) {
    $log.debug('ElementStack: initialized');

    var obj = {content:null};

    var promises = [];

    // inner class represents the stack and provides utility functions
    function Stack(){
      this.top = null;
      this.count = 0;

      this.clearAll = function() {
        this.top = null;
        this.count = 0;
      };

      this.getCount = function(){
        return this.count;
      };

      this.getTop = function(){
        return this.top;
      };

      this.push = function(data){
        var node = {
          data : data,
          next : null
        };

        node.next = this.top;
        this.top = node;

        this.count++;
      };

      this.peek = function(){
        if(this.top === null){
          return null;
        } else {
          return this.top.data;
        }
      };

      this.pop = function(){
        if(this.top === null){
          return null;
        } else {
          var out = this.top;
          this.top = this.top.next;
          if(this.count>0){
            this.count--;
          }

          return out.data;
        }
      };

      this.displayAll = function(){
        if(this.top === null){
          return null;
        } else {
          var arr = [];
          var current = this.top;
 
          for(var i = 0;i<this.count;i++){
            arr[i] = current.data;
            current = current.next;
          }

          return arr;
        }
      };
    }

    obj.stack = new Stack();

    // initialize the element stack
    obj.initialize = function(executor, json){
      var deferred = $q.defer();
      obj.stack.clearAll();
      var moduleHierarchy = JSON.parse(JSON.stringify(json.moduleHierarchy));
      handlerService.init();

      executableService.init(executor).then(function() {
        promises = [];

        loadModuleHierarchy(null, 'moduleHierarchy', moduleHierarchy).then(function() {
          obj.stack.push(moduleHierarchy);
          deferred.resolve();
        }, function(error) {
          deferred.reject(error);
        });
      }, function(error) {
        deferred.reject(error);
      });
      
      return deferred.promise;
    };

    // create promise which is resolved once the whole hierarchy is loaded
    var loadModuleHierarchy = function(parent, key, element) {
      var deferred = $q.defer();
      convertJson(0, parent, key, element, deferred);
      return deferred.promise;
    };

    // converting JSON into JavaScripts objects
    var convertJson = function(depth, parent, key, element, deferred){
      if ('tatoolType' in element) {
        if (element.tatoolType === 'Executable') {

          var executableDefer = $q.defer();
          promises.push(executableDefer.promise);

          // instantiate executables and register with executableService
          executableService.addExecutable(element).then(function(exec) {
            var executable = exec;
            parent[key] = executable;
            executableDefer.resolve(exec);
          }, function(err) {
            executableDefer.reject(err);
          });
        }
      }
      
      if ('iterator' in element) {
        var iteratorType = element.iterator.customType;
        var IteratorService = $injector.get(iteratorType);
        var iterator = new IteratorService();
        
        angular.extend(iterator, element.iterator);
        element.iterator = iterator;
      }
      if ('handlers' in element) {
        for (var i = 0; i < element.handlers.length; i++) {
          // instantiate handlers and register with handlerService
          var handler = handlerService.addHandler(element.handlers[i]);
          element.handlers[i] = handler;
        }
      }
      if ('children' in element) {
        angular.forEach(element.children, function(value, key) {
          convertJson(depth + 1, element.children, key, value, deferred);
        });
      }

      // finished loading check for all promises to be finished, then resolve main promise
      if (depth === 0) {
        $q.all(promises).then(function() {
          deferred.resolve('moduleHierarchy loaded');
        }, function(error) {
          deferred.reject(error);
        });
      }

    };

    return obj;
}

export default ElementStackService;
