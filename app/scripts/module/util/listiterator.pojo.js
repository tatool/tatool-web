'use strict';

var ListIterator = function() {
    this.executedIterations = 0;
    this.iter = null;
};

// logic to select the next element
ListIterator.prototype.selectNextElement = function(currentStack) {
  if (this.iter === null || !this.iter.hasNext()) {
    if (this.canCreateIterator()) {
      this.createIterator(currentStack);
      this.executedIterations++;
    } else {
      this.executedIterations = 0;
      this.iter = null;
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
ListIterator.prototype.canCreateIterator = function() {
  return ((this.executedIterations < this.numIterations) || (this.numIterations < 0));
};

// creates a simple iterator over child elements
ListIterator.prototype.createIterator = function(currentStack) {
  var currentElement = currentStack.peek().children;
  if (currentStack.peek().tatoolType === 'List') {
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
