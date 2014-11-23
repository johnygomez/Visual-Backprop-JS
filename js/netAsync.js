self.importScripts('../lib/ann.js');
// complex network object
var _net = new Network();
// simplified network used to emit
var net = {};
var errorSet = [];

var simplify = function() {
  net.neurons = {};
  net.connections = [];
  net.inputs = [];
  net.outputs = [];
  var len = _net.network_.length
  for (var i = 0; i < len; i++) {
    net.neurons[_net.network_[i].id] = [
      _net.network_[i].inp,
      _net.network_[i].out,
      _net.network_[i].biasWeight
    ];
  }
  len = _net.connections.length;
  for (var i = 0; i < len; i++) {
    net.connections.push({
      from: _net.connections[i].from.id,
      to: _net.connections[i].to.id,
      weight: _net.connections[i].weight
    });
  }
  len = _net.inputs.length
  for (var i = 0; i < len; i++) {
    net.inputs.push(_net.inputs[i].id);
  }
  len = _net.outputs.length
  for (var i = 0; i < len; i++) {
    net.outputs.push(_net.outputs[i].id);
  }
  return self.net;
};

var learn = function() {
  self.postMessage('Learning')
};

self.onmessage = function(evt) {
  if (typeof(evt.data) !== undefined) {
    if (evt.data.cmd === 'learn') {
      var epochs = evt.data.epochs;
      var rate = evt.data.refreshRate || 1000
      var chunks = epochs / rate;
      self.errorSet = [];
      for (var i = 0; i < chunks; i++) {
        self.errorSet.push(_net.learn_(rate, evt.data.gamma, evt.data.trainSet));
        self.emit('update');
      }
      self.emit('learned');
    } else if (evt.data.cmd === 'init') {
      _net.init_();
      self.emit('update');
    } else if (evt.data.cmd === 'run') {
      _net.test_(evt.data.pattern);
      self.emit('result');
    } else if (evt.data.cmd === 'add') {
      _net.addNeuron(evt.data.id);
      _net.init_();
      self.emit('update');
    } else if (evt.data.cmd === 'remove') {
      _net.removeNeuron(evt.data.id);
      _net.init_();
      self.emit('update');
    } else if (evt.data.cmd === 'change') {
      var neuron = _net.getNeuron(evt.data.id);
      neuron.biasWeight = evt.data.bias;
    } else if (evt.data.cmd === 'setInput') {
      _net.setInput(evt.data.pattern);
      _net.test_(evt.data.pattern);
      self.emit('update');
    } else if (evt.data.cmd === 'connect') {
      if (typeof(evt.data.weight) !== 'undefined') {
        _net.connect(evt.data.from, evt.data.to, evt.data.weight);
      } else {
        _net.connect(evt.data.from, evt.data.to);
      }
      self.emit('update');
    } else if (evt.data.cmd === 'disconnect') {
      _net.removeConnection(evt.data.from, evt.data.to);
      self.emit('update');
    }
  }
};

var emit = function(type) {
  if (type === 'update') {
    self.postMessage({
      cmd: 'update',
      net: self.simplify()
    });
  } else if (type === 'learned') {
    self.postMessage({
      cmd: 'learned',
      errorSet: self.errorSet
    });
  } else if (type === 'result') {
    var result = [];
    for (var i = 0; i < _net.inputs.length; i++) {
      result.push(_net.inputs[i].out);
    };
    for (var i = 0; i < _net.outputs.length; i++) {
      result.push(_net.outputs[i].out);
    };
    self.postMessage({
      cmd: 'result',
      result: result
    });
  }
}
var update = function() {

}