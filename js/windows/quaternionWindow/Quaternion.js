import { Matrix4, Quaternion, Vector3 } from "../../../libJs/three.module.js";
class QuaternionBase {
  constructor(s, x, y, z) {
    this.s = s;
    this.x = x;
    this.y = y;
    this.z = z;
    this.matrix = new Matrix4();
    this.matrix.set(
      1 - 2 * (Math.pow(this.y, 2) + Math.pow(this.z, 2)),
      2 * (this.x * this.y - this.s * this.z),
      2 * (this.x * this.z + this.s * this.y),
      0,
      2 * (this.x * this.y + this.s * this.z),
      1 - 2 * (Math.pow(this.x, 2) + Math.pow(this.z, 2)),
      2 * (this.y * this.z - this.s * this.x),
      0,
      2 * (this.x * this.z - this.s * this.y),
      2 * (this.y * this.z + this.s * this.x),
      1 - 2 * (Math.pow(this.x, 2) + Math.pow(this.y, 2)),
      0,
      0,
      0,
      0,
      1
    );
  }
  normalize() {
    return this.multiplyScalar(1 / this.norm());
  }
  // operators
  add(other) {
    return new QuaternionBase(
      this.s + other.s,
      this.x + other.x,
      this.y + other.y,
      this.z + other.z
    );
  }
  dot(other) {
    return (
      this.s * other.s + this.x * other.x + this.y * other.y + this.z * other.z
    );
  }
  multiply(other) {
    let s1 = this.s;
    let s2 = other.s;
    let v1 = new Vector3(this.x, this.y, this.z);
    let v2 = new Vector3(other.x, other.y, other.z);
    let res = v2
      .clone()
      .multiplyScalar(s1)
      .add(v1.clone().multiplyScalar(s2))
      .add(v1.clone().cross(v2));
    return new QuaternionBase(s1 * s2 - v1.dot(v2), res.x, res.y, res.z);
  }
  multiplyScalar(scalar) {
    return new QuaternionBase(
      this.s * scalar,
      this.x * scalar,
      this.y * scalar,
      this.z * scalar
    );
  }
  norm() {
    let res = new Vector3(this.x, this.y, this.z);
    return Math.sqrt(Math.pow(this.s, 2) + res.dot(res.clone()));
  }
  invert() {
    return new Quaternion(this.s, -this.x, -this.y, -this.z).multiplyScalar(
      1 / Math.pow(this.norm, 2)
    );
  }
  negate() {
    return new Quaternion(-this.s, -this.x, -this.y, -this.z);
  }

  slerp(other, t) {
    let v0 = this.normalize();
    let v1 = other.normalize();

    let dot = v0.dot(v1);
    if (dot < 0.0) {
      v1 = v1.negate();
      dot = -dot;
    }
    if (dot > 0.9995) {
      let result = v0.add(v1.add(v0.negate()).multiplyScalar(t));
      return result.normalize();
    }
    let theta_0 = Math.acos(dot);
    let theta = theta_0 * t;
    let sin_theta = Math.sin(theta);
    let sin_theta_0 = Math.sin(theta_0);
    let s0 = Math.cos(theta) - (dot * sin_theta) / sin_theta_0;
    let s1 = sin_theta / sin_theta_0;
    return v0.multiplyScalar(s0).add(v1.multiplyScalar(s1));
  }
}

class QuaternionAngle extends QuaternionBase {
  constructor(theta, x, y, z) {
    let s = Math.cos(theta / 2);
    let angle = Math.sin(theta / 2);
    let v_x = x * angle;
    let v_y = y * angle;
    let v_z = z * angle;
    super(s, v_x, v_y, v_z);
    this.theta = theta;
    this.a = new Vector3(x, y, z);
  }
  updateValues() {
    this.s = Math.cos(this.theta / 2);
    let angle = Math.sin(this.theta / 2);
    this.x = this.a.x * angle;
    this.y = this.a.y * angle;
    this.z = this.a.z * angle;
  }
}

export { QuaternionBase, QuaternionAngle };