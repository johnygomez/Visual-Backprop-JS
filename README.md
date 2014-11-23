# Visual Backprop JS
## Neural network simulator, written purely in Javascript.

## Try it at [Example](http://neuron.tuke.sk/gamec/simulator/)

In src/ folder, you can find source files for NN back-end (Backprop).
Source files were built with [Browserify](https://github.com/substack/node-browserify).

In js/ folder, you can find source files for client side.
* [netAsync.js](https://github.com/johnygomez/Visual-Backprop-JS/blob/master/js/netAsync.js) is definition of web worker performing background computation
* [network.js](https://github.com/johnygomez/Visual-Backprop-JS/blob/master/js/network.js) is main file for client application, controlling UI events and network tasks (drawing error, result, learning...)
* [netPlumb.js](https://github.com/johnygomez/Visual-Backprop-JS/blob/master/js/netPlumb.js) Defines connectable network UI in [JsPlumb](http://www.jsplumb.org/)

Visual part of application was developed using [JQuery](http://jquery.com/) and [Bootstrap](http://getbootstrap.com/) for visual elements. Connectable network was developed using [JsPlumb](http://www.jsplumb.org/). Graphs are drawn with [ChartJS](http://www.chartjs.org/) library.

#Thanks for contributing