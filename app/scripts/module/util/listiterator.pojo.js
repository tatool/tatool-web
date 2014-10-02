
var ListIterator = function() {
    this.executedIterations = 0;
    this.iter = null;
};

// logic to select the next element
ListIterator.prototype.selectNextElement = function(currentStack) {
  if (this.iter == null || !this.iter.hasNext()) {
    if (this.canCreateIterator()) {
      this.createIterator(currentStack);
      this.executedIterations++;
    } else {
      this.executedIterations = 0;
      this.iter = null;
    }
  }

  // check whether we can push another element
  if (this.iter == null) {
    return false;
  }
     
  // get the next element and push it onto the stack
  var nextElement = this.iter.next();
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
  if (currentStack.peek().elementType == "List") {
    this.iter = {
      i:       0,
      hasNext: function() {
        return this.i < currentElement.length;
      },
      next:   function() {
        return currentElement[this.i++];
      }
    }
  } else {
    this.iter = {
      i:       1,
      hasNext: function() {
        if (this.i == 4 && currentElement.primary.dual == 'SUSPENDED') {
          this.i = 1;
          return true;
        } else if (this.i == 4 && currentElement.primary.dual != 'SUSPENDED') {
          return false;
        } else if (this.i < 4) {
          return true;
        }
      },
      next:   function() {
        if (this.i == 1 || this.i == 3) {
          this.i++;
          return currentElement.primary;
        } else {
          this.i++
          return currentElement.secondary;
        }
      }
    }
  }
};
