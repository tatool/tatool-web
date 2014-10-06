'use strict';

angular.module('tatool.module')
  .factory('elementStack', ['$log', '$injector', '$window', 'handlerService', 'executableService',
    function ($log, $injector, $window, handlerService, executableService) {
    $log.debug('ElementStack: initialized');

    var obj = {content:null};

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
      obj.stack.clearAll();
      var moduleHierarchy = JSON.parse(JSON.stringify(json.moduleHierarchy));
      handlerService.init();
      executableService.init(executor);
      obj.convertJson(null, 'moduleHierarchy', moduleHierarchy);
      obj.stack.push(moduleHierarchy);
    };

    // converting JSON into JavaScripts objects
    obj.convertJson = function(parent, key, element){
      if ('elementType' in element) {
        if (element.elementType === 'Executable') {
          // instantiate executables and register with executableService
          var executable = executableService.addExecutable(element);
          parent[key] = executable;
        }
      }
      if ('iterator' in element) {
        var iteratorId = element.iterator.id;
        var iterator = new $window[iteratorId]();
        
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
          obj.convertJson(element.children, key, value);
        });
      }
    };

    return obj;
  }]);
