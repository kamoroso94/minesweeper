export default class Timer {
  constructor(callback, interval) {
    this.callback = callback;
    this.interval = interval;
    this.startTime = 0;
    this.lastTime = 0;
    this.timerId = 0;
  }

  resume() {
    this.startTime = this.startTime + Date.now() - this.lastTime;
    this.pause();

    this.timerId = setInterval((self) => {
      this.lastTime = Date.now();
      this.callback.call(this, this.lastTime - this.startTime);
    }, this.interval);
  }

  pause() {
    if(this.timerId != 0) {
      clearInterval(this.timerId);
      this.timerId = 0;
    }
  }

  reset() {
    this.startTime = 0;
    this.lastTime = 0;
    this.pause();
  }
}
