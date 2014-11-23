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
  this.currentError = 0;
  var self = this;

  //////////////////////////////
  // Neuron manipulating methods
  this.addNeuron = function(id) {
    var neuron = new Neuron();
    neuron.id = id;
    this.network_.push(neuron);
    this.init_();
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
    this.init_();
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
    this.init_();
  };
  this.connect = function(from, to, weight) {
    if (typeof(from) === 'number') {
      from = this.getNeuron(from);
    }
    if (typeof(to) === 'number') {
      to = this.getNeuron(to);
    }
    var c = new Connection(from, to);
    if (typeof(weight) !== 'undefined' && weight !== null) {
      c.weight = weight;
    }
    this.connections.push(c);
    from.addConnection(c);
    to.addConnection(c);
    this.init_();
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
    var len = trainSet.length;
    this.currentError = 0;
    this.changeGamma(gamma);
    // this.errorSet = [];

    for (var i = epochs; i >= 0; i--) {
      for (var j = 0; j < len; j++) {
        this.learningStep_(trainSet[j]);
        // currentError += Math.pow(this.outputs[0].desired - this.outputs[0].out, 2);
      }
      // if (i % 5000 === 0) {
      //   this.errorSet.push(error / (2 * len));
      //   // console.log(i, error / 2);
      // }
      trainSet = this.shuffle(trainSet);
    }
    for (var j = 0; j < len; j++) {
      this.currentError += Math.pow(this.outputs[0].desired - this.outputs[0].out, 2);
    }
    return this.currentError;
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