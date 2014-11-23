!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Network=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Connection = function(from, to, weight) {
  this.from = from;
  this.to = to;
  this.weight = weight || this.initWeight();
  this.updateWeight = function() {
    this.weight += this.gamma * this.from.out * this.to.delta;
  };
};
Connection.prototype.gamma = 0.1;
Connection.prototype.initWeight = function() {
  return (Math.random() * 2 - 1);
};
module.exports = Connection;
},{}],2:[function(require,module,exports){
///////////////////////////
/// Johny Gomez (C) 2014///
///////////////////////////
var Neuron = require('./Neuron');
var Connection = require('./Connection');

var Network = function() {
  this.connections = [];
  this.errorSet = [];
  this.inputs = [];
  this.network = [];
  this.network_ = [];
  this.outputs = [];
  var self = this;

  //////////////////////////////
  // Neuron manipulating methods
  this.addNeuron = function(id) {
    var neuron = new Neuron();
    neuron.id = id;
    this.network_.push(neuron);
    return neuron;
  };
  this.removeNeuron = function(id) {
    this.network_ = this.network_.filter(function(neuron) {
      if (neuron.id !== id) {
        return true;
      }
    });
    this.connections = this.connections.filter(function(conn) {
      if (conn.from.id !== id && conn.to.id !== id) {
        return true;
      }
    });
  };
  this.getNeuron = function(id) {
    var filtered = this.network_.filter(function(neuron) {
      if (neuron.id == id) {
        return true;
      }
    });
    return filtered[0];
  };

  ///////////////////////////////////
  // Connections manipulating methods
  this.getConnection = function(from, to) {
    if (typeof(from) === 'number') {
      from = this.getNeuron(from);
    }
    if (typeof(to) === 'number') {
      to = this.getNeuron(to);
    }
    var filtered = this.connections.filter(function(conn) {
      if (conn.from === from && conn.to === to) {
        return true;
      }
    });
    return filtered[0];
  };
  this.removeConnection = function(from, to) {
    var connection = this.getConnection(from, to);
    this.connections = this.connections.filter(function(conn) {
      if (conn !== connection) {
        return true;
      }
    })
  };
  this.connect = function(from, to) {
    if (typeof(from) === 'number') {
      from = this.getNeuron(from);
    }
    if (typeof(to) === 'number') {
      to = this.getNeuron(to);
    }
    var c = new Connection(from, to);
    this.connections.push(c);
    from.addConnection(c);
    to.addConnection(c);
    return c;
  };

  // Set current input to network
  this.setInput = function(pattern) {
    for (var i = 0; i < this.inputs.length; i++) {
      this.inputs[i].out = pattern[i];
    }
  };

  this.changeGamma = function(gamma) {
    Connection.prototype.gamma = gamma;
  };

  // @param structure - array with numbers of neuron in layers
  // e.g. [1,2,1] creates 3 layer network, with 1 - 2 - 1 setup
  // this method will be removed, uses layered access
  this.init = function(structure) {
    this.network = [];
    this.connections = [];
    structure.forEach(function(layerSize, index) {
      self.network.push([]);
      for (var i = 0; i < structure[index]; i++) {
        var neuron = new Neuron();
        self.network[index].push(neuron);
        if (index > 0) {
          try {
            self.network[index - 1].forEach(function(_neuron) {
              self.connect(_neuron, neuron);
            });
          } catch (err) {
            console.log(self.network);
            console.log(err)
          }
        }
      }
    });
  };

  // Method initializes network for recursive algorithm
  this.init_ = function() {
    this.inputs = this.network_.filter(function(neuron) {
      if (neuron.connectionsTo.length === 0) {
        return true;
      }
    });
    this.outputs = this.network_.filter(function(neuron) {
      if (neuron.connectionsFrom.length === 0) {
        return true;
      }
    });
  };

  // run forward by layers
  this.runFwd = function(pattern) {
    var len = this.network.length;
    // input pattern
    for (var id = 0; id < this.network[0].length; id++) {
      this.network[0][id].out = pattern[id];
    }
    // skip first layer, it already has output set
    for (var layer = 1; layer < len; layer++) {
      var layerSize = this.network[layer].length;
      for (var neuron = 0; neuron < layerSize; neuron++) {
        this.network[layer][neuron].calculateOutput();
      };
    };
  };

  // run forward recursively, starting at the output neuron
  this.run = function(pattern) {
    var len = this.inputs.length;
    // input pattern
    for (var i = 0; i < len; i++) {
      this.inputs[i].out = pattern[i];
    }
    len = this.outputs.length;
    // get output recursively
    for (var i = 0; i < len; i++) {
      this.outputs[i].getOutput();
    }
  };

  // one learning cycle in layered access
  this.learningStep = function(pattern) {
    var len = this.network[this.network.length - 1].length;
    // setup input from teacher
    for (var i = 0; i < len; i++) {
      this.network[this.network.length - 1][len - i - 1].desired = pattern[pattern.length - i - 1];
    };
    this.runFwd(pattern);
    for (var i = this.network.length - 1; i >= 0; i--) {
      var layerSize = this.network[i].length;
      for (var j = layerSize - 1; j >= 0; j--) {
        this.network[i][j].calculateDelta();
      };
    };
    for (var i = this.connections.length - 1; i >= 0; i--) {
      this.connections[i].updateWeight();
    };
  };

  // one learning step in recursive access
  this.learningStep_ = function(pattern) {
    var len = this.outputs.length;
    this.run(pattern);
    // setup input from teacher
    for (var i = 0; i < len; i++) {
      this.outputs[len - i - 1].desired = pattern[pattern.length - i - 1];
    };
    len = this.inputs.length;
    for (var i = 0; i < len; i++) {
      this.inputs[i].getDelta();
    }
    for (var neuron = this.network_.length - 1; neuron >= 0; neuron--) {
      this.network_[neuron].updateBias();
    }
    for (var i = this.connections.length - 1; i >= 0; i--) {
      this.connections[i].updateWeight();
    };
  };

  // learn layer by layer
  this.learn = function(epochs, trainSet) {
    var len = trainSet.length;
    for (var i = epochs; i > 0; i--) {
      var error = 0;
      for (var j = 0; j < len; j++) {
        this.learningStep(trainSet[j]);
        error += Math.pow(this.network[this.network.length - 1][0].desired - this.network[this.network.length - 1][0].out, 2);
      }
      if (i % 500 === 0) {
        console.log(i, error / 2);
      }
      trainSet = this.shuffle(trainSet);
    }
  };

  // learn recursively, starting from input
  this.learn_ = function(epochs, gamma, trainSet) {
    var evt = document.createEvent('Event');
    var len = trainSet.length;
    this.changeGamma(gamma);
    this.errorSet = [];
    evt.initEvent('update', true, true);

    for (var i = epochs; i >= 0; i--) {
      var error = 0;
      for (var j = 0; j < len; j++) {
        this.learningStep_(trainSet[j]);
        error += Math.pow(this.outputs[0].desired - this.outputs[0].out, 2);
      }
      if (i % 5000 === 0) {
        this.errorSet.push(error / (2 * len));
        document.dispatchEvent(evt);
        console.log(i, error / 2);
      }
      trainSet = this.shuffle(trainSet);
    }
    return this.errorSet;
  };

  // test network by layers
  this.test = function(pattern) {
    this.runFwd(pattern);
    this.network[this.network.length - 1].forEach(function(neuron, id) {
      console.log('Neuron ', id, ': ', neuron.out);
    });
  };

  // test network recursively
  this.test_ = function(pattern) {
    var out = [];
    this.run(pattern);
    this.outputs.forEach(function(neuron) {
      out.push(neuron.out);
    })
    return out;
  }

  // shuffles array
  this.shuffle = function(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  };
};

module.exports = Network;
},{"./Connection":1,"./Neuron":3}],3:[function(require,module,exports){
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
},{"./Connection":1}]},{},[2])(2)
});