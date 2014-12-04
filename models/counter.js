var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var Counter = new mongoose.Schema({
    _id: String,
    next: {
      type: Number, 
      default: 100000
    }
});

Counter.statics.getUserCode = function (callback) {
    return this.findByIdAndUpdate('userCode', { $inc: { next: 1 } }, {new: true, upsert: true, select: {next: 1}}, callback);
};

module.exports = mongoose.model( 'Counter', Counter );