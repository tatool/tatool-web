tatool.factory('myExecutable', [ 'tatoolExecutable',
  function (tatoolExecutable) {  

    var MyExecutable = tatoolExecutable.createExecutable();

    MyExecutable.prototype.init = function() {
      // our Executable initialization code goes here
    };

    // our custom methods go here
    MyExecutable.prototype.stopExecution = function() {
      tatoolExecutable.stop();
    };

    return MyExecutable;
  }]);