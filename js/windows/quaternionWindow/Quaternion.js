class QuaternionCustom {
  constructor(vector, theta) {
    this.vector = vector;
    this.theta = theta;
    this.x = this.vector.x;
    this.y = this.vector.y;
    this.z = this.vector.z;
  }
}

export { QuaternionCustom };
