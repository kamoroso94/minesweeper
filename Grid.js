export default class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Array(width * height);
  }

  set(x, y, val) {
    if(!this.has(x, y)) return;
    this.data[x + y * this.width] = val;
  }

  get(x, y) {
    if(!this.has(x, y)) return;
    return this.data[x + y * this.width];
  }

  has(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
