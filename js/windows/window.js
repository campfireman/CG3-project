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

    update(delta_t) {
        throw new TypeError("Must override method");
    }

    hide() {
        this.getGUI().hide();
    }

    show() {
        this.getGUI().show();
    }
}

export { Window };
