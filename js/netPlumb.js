///////////////////////////
/// Johny Gomez (C) 2014///
///////////////////////////
// initialize JsPlumb
var id = 1; // neuron counter
jsPlumb.importDefaults({
  PaintStyle: {
    lineWidth: 4,
    strokeStyle: 'rgba(200,0,0,0.5)'
  },
  Anchors: ['RightMiddle', 'LeftMiddle'],
  Connector: 'Bezier',
  DragOptions: {
    cursor: "pointer"
  },
  Endpoints: [
    ["Dot", {
      radius: 8
    }],
    ["Dot", {
      radius: 8
    }]
  ],
  EndpointStyles: [{
    fillStyle: "#225588"
  }, {
    fillStyle: "#558822"
  }],
});
// run JsPlumb
jsPlumb.ready(function() {
  jsPlumb.setContainer($('#networkContainer'));
  jsPlumb.bind('connection', function(info) {
    var source = $('#' + info.sourceId).data('id');
    var target = $('#' + info.targetId).data('id');
    var netConnection = net.connect(source, target);
    var weight = netConnection.weight.toFixed(5);
    info.connection.addOverlay(["Label", {
      width: 10,
      height: 10,
      id: "label",
      label: weight
    }]);
    init();
  });
  jsPlumb.bind('connectionDetached', function(info) {
    var source = $('#' + info.sourceId).data('id');
    var target = $('#' + info.targetId).data('id');
    net.removeConnection(source, target);
    init();
  });
  jsPlumb.bind('connectionMoved', function(info) {
    var source = $('#' + info.originalSourceId).data('id');
    var target = $('#' + info.originalTargetId).data('id');
    net.removeConnection(source, target);
    var newSource = $('#' + info.newSourceId).data('id');
    var newTarget = $('#' + info.newTargetId).data('id');
    net.connect(newSource, newTarget);
    init();
  });
  $('#networkContainer').dblclick(function(e) {
    var neuron = net.addNeuron(id);
    createNeuron(id, e.pageX, e.pageY);
    id++;
    init();
  });
});

// Create new neuron in network
var createNeuron = function(id, x, y) {
  // position
  var x = x;
  var y = y;
  // root node for neuron
  var newState = $('<div>').attr('id', 'neuron' + id).addClass('item').data({
    id: id,
    x: x,
    y: y
  });

  var neuron = net.getNeuron(id);
  var inp = neuron.inp;
  var out = neuron.out;

  // create inner nodes for in/out and connections
  var inputNode = $('<div>').addClass('inputNode').text('In:' + inp);
  var outNode = $('<div>').addClass('outputNode').text('Out:' + out);
  var title = $('<div>').addClass('title');
  var connect = $('<div>').addClass('connect').append('<i class="fa fa-plus-circle fa-2x"></i>');
  newState.css({
    'top': y,
    'left': x,
  });
  // connect all parts of neuron and append to network
  title.append(inputNode);
  title.append(outNode);
  newState.append(title);
  newState.append(connect);
  $('#networkContainer').append(newState);
  // make neuron connectable
  jsPlumb.makeTarget(newState, {});
  jsPlumb.makeSource(connect, {
    parent: newState,
  });
  jsPlumb.draggable(newState, {
    containment: 'parent'
  });
  // make deattachable
  newState.dblclick(function(e) {
    var id = $(this).data('id');
    net.removeNeuron(id);
    jsPlumb.detachAllConnections($(this));
    $(this).remove();
    e.stopPropagation();
    init();
  });
  init();
};
// Exports network as json object
var save = function() {
  // get all neuron items and save them stringifyable
  var blocks = []
  $(".item").each(function(idx, elem) {
    var $elem = $(elem);
    blocks.push({
      id: $elem.data('id'),
      x: parseInt($elem.css("left"), 10),
      y: parseInt($elem.css("top"), 10)
    });
  });

  // Get all connections and store most important info about them 
  var connections = [];
  $.each(jsPlumb.getConnections(), function(idx, connection) {
    var sourceId = parseInt($('#' + connection.sourceId).data('id'));
    var targetId = parseInt($('#' + connection.targetId).data('id'));
    connections.push({
      connectionId: connection.id,
      sourceId: sourceId,
      targetId: targetId,
      weight: net.getConnection(sourceId, targetId).weight
    });
  });

  // construct js object to store from all parts
  var plumb = {
    network: net,
    items: blocks,
    connections: connections
  };

  var saveFile = JSON.stringify(JSON.decycle(plumb));

  // create virtual link to file, trigger it and then remove 
  var data = "text/json;charset=utf-8," + encodeURIComponent(saveFile);
  $('<a id="downloadLink" href="data:' + data + '" download="network.net">download JSON</a>').appendTo('body');
  document.getElementById('downloadLink').click();
  $('#downloadLink').remove();
  return saveFile;
};

// Loads network from JSON object
var load = function() {
  // read file
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    alert('The File APIs are not fully supported in this browser.');
    return;
  }
  var files = document.getElementById('netFile').files;
  var file = files[0];
  var reader = new FileReader();
  reader.onload = function() {
    var loadFile = reader.result;
    // parse and recover data
    var loadedData = JSON.retrocycle(JSON.parse(loadFile));
    var indexes = loadedData.items.map(function(item) {
      return item.id;
    });
    var neurons = {};
    loadedData.network.network_.forEach(function(neuron) {
      neurons[neuron.id] = neuron.biasWeight;
    });
    id = Math.max.apply(Math, indexes);
    id++;

    net = new Network();
    net.errorSet = loadedData.network.errorSet;

    if (loadedData.items) {
      loadedData.items.forEach(function(node) {
        neuron = net.addNeuron(node.id);
        createNeuron(node.id, node.x, node.y);
        neuron.biasWeight = neurons[node.id];
      });
    }

    if (loadedData.connections) {
      loadedData.connections.forEach(function(connection) {
        var sourceId = parseInt(connection.sourceId);
        var targetId = parseInt(connection.targetId);
        jsPlumb.connect({
          source: 'neuron' + sourceId,
          target: 'neuron' + targetId
        });
        var newConn = net.connect(sourceId, targetId);
        newConn.weight = connection.weight;
      })
    }
  }
  reader.readAsText(file);
};