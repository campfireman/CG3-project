class Window {
  constructor(renderer) {
    this.renderer = renderer;
  }

  getScene() {
    throw new TypeError("Must override method");
  }

  getCamera() {
    throw new TypeError("Must override method");
  }

  getGUI() {
    throw new TypeError("Must override method");
  }

  update(time) {
    throw new TypeError("Must override method");
  }
}

export { Window };
