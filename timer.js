function Timer(callback, interval) {
    this.callback = callback;
    this.interval = interval;
    this.startTime = 0;
    this.lastTime = 0;
    this.timerId = 0;
}

Timer.prototype.resume = function() {
    this.startTime = this.startTime + Date.now() - this.lastTime;
    this.pause();
    
    this.timerId = setInterval(function(self) {
        self.lastTime = Date.now();
        self.callback(self.lastTime - self.startTime);
    }, this.interval, this);
};

Timer.prototype.pause = function() {
    if(this.timerId != 0) {
        clearInterval(this.timerId);
        this.timerId = 0;
    }
};

Timer.prototype.reset = function() {
    this.startTime = 0;
    this.lastTime = 0;
    this.pause();
};
