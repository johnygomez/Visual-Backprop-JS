///////////////////////////
/// Johny Gomez (C) 2014///
///////////////////////////
var Connection = require('./Connection');

var Neuron = function() {
  var self = this;
  this.connectionsFrom = [];
  this.connectionsTo = [];
  this.bias = -1;
  this.biasWeight = ((Math.random() * 2) - 1);
  this.out = 0.0;
  this.inp = 0.0;
  this.delta = null;
  this.desired = null;
  this.domNode = null;
  this.id = null;

  this.addConnection = function(c) {
    if (this === c.from) {
      this.connectionsFrom.push(c);
    } else {
      this.connectionsTo.push(c);
    }
  };
  this.calculateInput = function() {
    this.inp = this.bias * this.biasWeight;
    for (var i = this.connectionsTo.length - 1; i >= 0; i--) {
      this.inp += this.connectionsTo[i].from.out * this.connectionsTo[i].weight;
    };
  };
  this.getOutput = function() {
    if (this.connectionsTo.length !== 0) {
      this.inp = this.bias * this.biasWeight;
      var len = this.connectionsTo.length;
      for (var i = 0; i < len; i++) {
        this.inp += this.connectionsTo[i].from.getOutput() * this.connectionsTo[i].weight;
      }
      this.out = this.activationFunction(this.inp);
    }
    return this.out;
  };
  this.getDelta = function() {
    this.delta = 0;
    if (this.connectionsFrom.length === 0) {
      this.delta = (this.desired - this.out) * this.activationDerivation(this.inp);
    }
    else {
      var deltaSum = 0;
      for (var i = this.connectionsFrom.length - 1; i >= 0; i--) {
        deltaSum += this.connectionsFrom[i].to.getDelta() * this.connectionsFrom[i].weight;
      }
      this.delta = deltaSum * this.activationDerivation(this.inp);
    }
    return this.delta;
  };
  this.updateBias = function() {
    this.biasWeight += Connection.prototype.gamma * this.delta * this.bias;
  };
  this.calculateOutput = function() {
    this.calculateInput();
    this.out = this.activationFunction(this.inp);
  };
  this.calculateDelta = function() {
    if (this.connectionsFrom.length === 0) {
      try {
        var error = this.desired - this.out;
        this.delta = error * this.activationDerivation(this.inp);
      } catch (err) {
        console.error(err);
      }
    } else {
      var deltaSum = 0;
      for (var i = this.connectionsFrom.length - 1; i >= 0; i--) {
        deltaSum += this.connectionsFrom[i].to.delta * this.connectionsFrom[i].weight;
      }
      this.delta = deltaSum * this.activationDerivation(this.inp);
    }
    this.biasWeight += Connection.prototype.gamma * this.delta * this.bias;
  };

  this.activationFunction = function(x) {
    return (1 / (1 + Math.exp(-x)));
  };
  this.activationDerivation = function(x) {
    return (Math.exp(-x) / Math.pow((1 + Math.exp(-x)), 2));
  }

};

module.exports = Neuron;