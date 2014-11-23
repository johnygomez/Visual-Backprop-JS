///////////////////////////
/// Johny Gomez (C) 2014///
///////////////////////////
var net = new Network();
// default trainset XOR
var trainSet = [
  [0, 0, 0],
  [0, 1, 1],
  [1, 1, 0],
  [1, 0, 1]
]
// // listen to update UI event from network
// document.addEventListener('update', function() {
//   updateUI();
// }, true);

// Initialize network
var init = function() {
  net.init_();
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
  inputData.append('<button onclick="setInputs();" class="btn btn-primary">Set Inputs</button>');
  updateUI();
};

// triggers learning algorithm
// learn_ method will be replaced by normal "learn"
var learn = function() {
  // initialize network and learn
  net.init_();
  net.learn_($('#epochs').val(), $('#gamma').val(), trainSet);

  updateUI();
  drawResult();
};

// run network once with inputs from form
var run = function() {
  var testSet = []
  $('#inputData input').each(function() {
    testSet.push($(this).val());
  })
  net.test_(testSet);
  updateUI();
};

// Set current inputs to network
var setInputs = function() {
  var testSet = []
  $('#inputData input').each(function() {
    testSet.push($(this).val());
  });
  net.setInput(testSet);
  updateUI();
}

// Refreshes UI
var updateUI = function() {
  drawError();
  $('.item').each(function() {
    var neuron = net.getNeuron($(this).data('id'));
    var inp = parseFloat(neuron.inp) || 0;
    var out = parseFloat(neuron.out) || 0;
    $(this).find('.inputNode').text('In:' + inp.toFixed(5));
    $(this).find('.outputNode').text('Out:' + out.toFixed(5));
  });
  $.each(jsPlumb.getConnections(), function(idx, connection) {
    var sourceId = parseInt($('#' + connection.sourceId).data('id'));
    var targetId = parseInt($('#' + connection.targetId).data('id'));
    var weight = net.getConnection(sourceId, targetId).weight.toFixed(5);
    connection.getOverlay('label').setLabel(weight);
  });
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UI functions

// Draw error graph
var drawError = function() {
  var ctx = document.getElementById("errorChart").getContext("2d");
  var labels = [];
  for (var i = 0; i < net.errorSet.length; i++) {
    labels.push(i * 5000)
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
      data: net.errorSet,
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

// Draw result object
var drawResult = function() {
  var canvas = document.getElementById("resultBox");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
      var out = Math.round(net.test_([x / 100, y / 100])[0]);
      if (out == 0) {
        ctx.fillRect(x, y, 1, 1);
      }
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