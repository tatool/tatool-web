'use strict';

ListIterator.$inject = ['timerUtils','executableUtils'];

function ListIterator(timerUtils, executableUtils) {

  var Iterator = function() { 
    this.executedIterations = 0;
    this.iter = null;
    this.name = (Math.random().toString(36)+'00000000000000000').slice(2,16+2);
    this.timerRunning = false;
    this.timerExpired = false;
  };

  // logic to select the next element
  Iterator.prototype.selectNextElement = function(currentStack, sessionCondition) {
    if (this.iter === null || !this.iter.hasNext()) {
      if (this.canCreateIterator(sessionCondition)) {
        this.createIterator(currentStack);
        this.executedIterations++;
      } else {
        if(this.timerEnabled) {
          this.timer.stop();
        }
        this.executedIterations = 0;
        this.iter = null;
        this.timer = null;
        this.timerRunning = false;
        this.timerExpired = false;
      }
    }

    // check whether we can push another element according to the iterator
    if (this.iter === null) {
      return false;
    }
       
    // get the next element
    var nextElement = this.iter.next();
    if (!nextElement) {
      return false;
    }

    // push it onto the stack
    currentStack.push(nextElement);
        
    return true;
  };

  // checks whether we can continue iterating
  Iterator.prototype.canCreateIterator = function(sessionCondition) {
    var isIterator = false;
    if (!this.condition || this.condition === '') {
      isIterator = true;
    } else if(this.condition === sessionCondition){
      isIterator = true;
    }

    if (isIterator) {
      isIterator = (this.executedIterations < this.numIterations) || (this.numIterations < 0);
    }

    if (isIterator) {
      isIterator = (this.timerExpired) ? false : true;
    }
    
    return isIterator;
  };

  // creates a simple iterator over child elements
  Iterator.prototype.createIterator = function(currentStack) {
    if(this.timerEnabled && !this.timerExpired && !this.timerRunning) {
      this.timer = timerUtils.createTimer(this.timerDuration, false, this);
    }
    if(this.timerEnabled && !this.timerRunning) {
      this.startTimer();
    }
    var currentElement = currentStack.peek().children;
    if (currentStack.peek().tatoolType === 'List') {
      
      if (currentElement.length > 1 && this.order && this.order === 'random') {
        this.shuffle(currentElement);
      }

      this.iter = {
        i:       0,
        hasNext: function() {
          return this.i < currentElement.length;
        },
        next:   function() {
          return currentElement[this.i++];
        }
      };
    } else {
      this.iter = {
        i:       0,
        hasNext: function() {
          if (this.i === 3 && currentElement.primary.dual === 'SUSPENDED') { 
            // multiple loops (1-2-1-2...)
            return true;
          } else if (this.i === 3 && currentElement.primary.dual !== 'SUSPENDED') { 
            // simple loop (1-2-1)
            return false;
          } else if (this.i < 3) {
            return true;
          }
        },
        next:   function() {
          if (this.i === 0 || this.i === 2) {
            this.i++;
            return currentElement.primary;
          } else if (this.i === 3 && currentElement.primary.dual === 'SUSPENDED' && currentElement.secondary) { 
            // multiple loops (1-2-1-2...)
            this.i = 2;
            currentElement.primary.dual = null;
            return currentElement.secondary;
          } else if (!currentElement.secondary) {
            // in case of no secondary element, skip to primary again
            this.i = 3;
            return currentElement.primary;
          } else {
            this.i++;
            return currentElement.secondary;
          }
        }
      };
    }
  };

  Iterator.prototype.startTimer = function() {
    this.timerRunning = true;
    this.timer.start(function(){ return this.endTimer(); }.bind(this));
  };

  Iterator.prototype.endTimer = function() {
    this.timerRunning = false;
    this.timerExpired = true;
    this.iter = null;
    if (this.timerEndEvent === 'immediate') {
      executableUtils.stopIteration();
    }
  }

  // Shuffle array using Fisher-Yates algorithm
  Iterator.prototype.shuffle = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  };

  return Iterator;

}

export default ListIterator;