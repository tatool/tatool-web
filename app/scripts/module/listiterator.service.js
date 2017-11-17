'use strict';

ListIterator.$inject = [];

function ListIterator() {

  var Iterator = function() { 
    this.executedIterations = 0;
    this.iter = null;
  };

  // logic to select the next element
  Iterator.prototype.selectNextElement = function(currentStack, sessionCondition) {
    if (this.iter === null || !this.iter.hasNext()) {
      if (this.canCreateIterator(sessionCondition)) {
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
    
    return isIterator;
  };

  // creates a simple iterator over child elements
  Iterator.prototype.createIterator = function(currentStack) {
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