'use strict';

MessageService.$inject = ['$rootScope'];

function MessageService($rootScope) {

  var queue = [];
  var currentMessage = { type: '', msg: ''};

  $rootScope.$on('$stateChangeSuccess', function() {
    currentMessage = queue.shift() || { type: '', msg: ''};
  });

  return {
    setMessage: function(message) {
      queue.push(message);
    },
    getMessage: function() {
      return currentMessage;
    }
  };
}

export default MessageService;