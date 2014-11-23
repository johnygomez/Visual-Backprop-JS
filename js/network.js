///////////////////////////
/// Johny Gomez (C) 2014///
///////////////////////////
var net = null;
var ctx = null;
var resultBox = null;
var worker = new Worker('js/netAsync.js');
worker.postMessage = worker.webkitPostMessage || worker.postMessage;
worker.onmessage = function(evt) {
  if (typeof(evt.data.cmd) !== undefined) {
    if (evt.data.cmd === 'update') {
      net = evt.data.net;
      init();
      updateUI();
    } else if (evt.data.cmd === 'learned') {
      resetCanvas();
      drawResult();
      drawError(evt.data.errorSet);
      $("#learnLogo").removeAttr('class').addClass('fa fa-check')
    } else if (evt.data.cmd === 'result') {
      drawPoint(evt.data.result[0], evt.data.result[1], evt.data.result[2]);
    }
  }
};
// default trainset XOR
var trainSet = [
  [0, 0, 0],
  [0, 1, 1],
  [1, 1, 0],
  [1, 0, 1]
]

// Initialize network
var init = function() {
  var inputData = $('#inputData');
  var inputsLength = net.inputs.length;
  inputData.empty();
  // for each input generate input box to enter value
  for (var i = 1; i <= inputsLength; i++) {
    inputData.append('<div class="form-group"> \
          <label for="input' + i + '">Input ' + i + '</label> \
          <input type="text" id="input' + i + '" value="0"> \
        </div>');
  };
  inputData.append('<button onclick="setInputs();" class="btn btn-primary">Set&Run</button>');
};

// triggers learning algorithm
// learn_ method will be replaced by normal "learn"
var learn = function() {
  worker.postMessage({
    cmd: 'learn',
    epochs: $('#epochs').val(),
    gamma: $('#gamma').val(),
    trainSet: trainSet,
    refreshRate: $('#refreshRate').val()
  })
  $("#learnLogo").removeAttr('class').addClass('fa fa-spinner fa-spin')
};

// run network once with inputs from form
var run = function() {
  // var testSet = []
  // $('#inputData input').each(function() {
  //   testSet.push($(this).val());
  // })
  // worker.postMessage({
  //   cmd: 'run',
  //   pattern: testSet
  // });
  drawResult();
};

// Set current inputs to network
var setInputs = function() {
  var testSet = []
  $('#inputData input').each(function() {
    testSet.push($(this).val());
  });
  worker.postMessage({
    cmd: 'setInput',
    pattern: testSet
  });
}

// Refreshes UI
var updateUI = function() {
  if (net === null) {
    return;
  }
  //drawError();
  $('.item').each(function() {
    var neuron = net.neurons[$(this).data('id')];
    if (typeof neuron === 'undefined') return false;
    var inp = parseFloat(neuron[0]) || 0.0;
    var out = parseFloat(neuron[1]) || 0.0;
    $(this).find('.inputNode').text('In:' + inp.toFixed(5));
    $(this).find('.outputNode').text('Out:' + out.toFixed(5));
  });
  $.each(jsPlumb.getConnections(), function(idx, connection) {
    var sourceId = parseInt($('#' + connection.sourceId).data('id'));
    var targetId = parseInt($('#' + connection.targetId).data('id'));
    var conn = net.connections.filter(function(conn) {
      if (conn.from === sourceId && conn.to === targetId) {
        return true;
      }
    })[0];
    if (typeof conn === 'undefined') return false;
    connection.getOverlay('label').setLabel(conn.weight.toFixed(5));
  });
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UI functions

// Draw error graph
var drawError = function(errorSet) {
  var ctx = document.getElementById("errorChart").getContext("2d");
  var labels = [];
  for (var i = 1; i < errorSet.length; i++) {
    labels.push(i * $('#refreshRate').val())
  };
  var data = {
    labels: labels,
    datasets: [{
      label: "Error function",
      fillColor: "rgba(220,220,220,0.2)",
      strokeColor: "rgba(220,220,220,1)",
      pointColor: "rgba(220,220,220,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(220,220,220,1)",
      data: errorSet,
    }]
  };
  var options = {
    scaleShowGridLines: true,
    scaleGridLineColor: "rgba(0,0,0,.05)",
    scaleGridLineWidth: 1,
    bezierCurve: false,
    pointDot: true,
    pointDotRadius: 4,
    pointDotStrokeWidth: 1,
    pointHitDetectionRadius: 20,
    datasetStroke: true,
    datasetStrokeWidth: 2,
    datasetFill: true,
  };
  var errorChart = new Chart(ctx).Line(data, options);
};

var resetCanvas = function() {
  resultBox = document.getElementById("resultBox");
  ctx = resultBox.getContext("2d");
  ctx.clearRect(0, 0, resultBox.width, resultBox.height);
};

var drawPoint = function(x, y, alpha) {
  if (ctx !== null && net !== null) {
    // denormalize
    var x = Math.round(x * 100);
    var y = Math.round(y * 100);
    ctx.fillStyle = 'rgba(0,0,0, ' + alpha + ')';
    ctx.fillRect(x, y, 1, 1);
  }
};
// Draw result object
var drawResult = function() {
  resetCanvas();
  for (var x = 0; x < resultBox.width; x++) {
    for (var y = 0; y < resultBox.height; y++) {
      worker.postMessage({
        cmd: 'run',
        pattern: [x / 100, y / 100]
      });
    }
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Parse pattern file into trainSet
// ToDo: update regex so that it accepts variable number of ins and outs
var readFile = function() {
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    alert('The File APIs are not fully supported in this browser.');
    return;
  }
  var files = document.getElementById('trainSetFile').files;
  var file = files[0];
  var reader = new FileReader();
  reader.onload = function() {
    var set = [];
    var arr = reader.result.match(/(\d+\.\d+[\s\S]{1,2}){2}(1|0)/g);
    arr.forEach(function(pattern) {
      var a = pattern.split(/[^\d\.]/);
      a = a.filter(function(substr) {
        if (substr.length !== 0) {
          return true;
        }
      });
      set.push(a);
    });
    // Update current training set
    trainSet = set;
    // draw training set to canvas
    var canvas = document.getElementById("uploadedBox");
    var ctx = canvas.getContext("2d");
    set.forEach(function(pixel) {
      if (pixel[2] == 0) {
        ctx.fillRect(Math.ceil(pixel[0] * 100), Math.ceil(pixel[1] * 100), 1, 1);
      }
    })
  };
  reader.readAsText(file);
};