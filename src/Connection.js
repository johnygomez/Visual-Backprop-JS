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