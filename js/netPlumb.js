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
    var weight = info.connection.getParameter('weight') || 0.0;
    worker.postMessage({
      cmd: 'connect',
      from: source,
      to: target,
      weight: info.connection.getParameter('weight') || null
    });
    info.connection.addOverlay(["Label", {
      width: 10,
      height: 10,
      id: "label",
      label: weight
    }]);
  });
  jsPlumb.bind('connectionDetached', function(info) {
    var source = $('#' + info.sourceId).data('id');
    var target = $('#' + info.targetId).data('id');
    worker.postMessage({
      cmd: 'disconnect',
      from: source,
      to: target
    });
    // net.removeConnection(source, target);
  });
  jsPlumb.bind('connectionMoved', function(info) {
    var source = $('#' + info.originalSourceId).data('id');
    var target = $('#' + info.originalTargetId).data('id');
    worker.postMessage({
      cmd: 'disconnect',
      from: source,
      to: target
    });
    var newSource = $('#' + info.newSourceId).data('id');
    var newTarget = $('#' + info.newTargetId).data('id');
    worker.postMessage({
      cmd: 'connect',
      from: newSource,
      to: newTarget
    });
  });
  $('#networkContainer').dblclick(function(e) {
    worker.postMessage({
      cmd: 'add',
      id: id
    });
    createNeuron(id, e.pageX, e.pageY);
    id++;
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

  // create inner nodes for in/out and connections
  var inputNode = $('<div>').addClass('inputNode').text('In:' + 0.0);
  var outNode = $('<div>').addClass('outputNode').text('Out:' + 0.0);
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
    worker.postMessage({
      cmd: 'remove',
      id: id
    });
    jsPlumb.detachAllConnections($(this));
    $(this).remove();
    e.stopPropagation();
  });
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
    var conn = net.connections.filter(function(conn) {
      if (conn.from === sourceId && conn.to === targetId) {
        return true;
      }
    })[0];
    connections.push({
      connectionId: connection.id,
      sourceId: sourceId,
      targetId: targetId,
      weight: conn.weight
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
    id = Math.max.apply(Math, indexes);
    id++;

    // net = new Network();
    // net.errorSet = loadedData.network.errorSet;

    if (loadedData.items) {
      loadedData.items.forEach(function(node) {
        worker.postMessage({
          cmd: 'add',
          id: node.id
        });
        worker.postMessage({
          cmd: 'change',
          id: node.id,
          bias: loadedData.network.neurons[node.id][2]
        });
        createNeuron(node.id, node.x, node.y);
      });
    }

    if (loadedData.connections) {
      loadedData.connections.forEach(function(connection) {
        var sourceId = parseInt(connection.sourceId);
        var targetId = parseInt(connection.targetId);
        jsPlumb.connect({
          source: 'neuron' + sourceId,
          target: 'neuron' + targetId,
          parameters: {
            weight: connection.weight
          }
        });
      })
    }
  }
  reader.readAsText(file);
};