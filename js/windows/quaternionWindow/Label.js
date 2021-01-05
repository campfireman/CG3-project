/**
 * Displays HTML based label and updates postion based on camera projection
 * onto the projection pane
 *
 * Based on:
 * https://codepen.io/smtrd/pen/MZVWpN
 */
class Label {
    /**
     *
     * @param {THREE.Vector3} position of the label in world coordinates
     * @param {*} text label to display
     * @param {*} camera camera of the scene
     */
    constructor(position, text, camera) {
        this.position = position;
        this.camera = camera;

        var div = document.createElement("div");
        div.className = "text-label";
        div.style.position = "absolute";
        div.style.width = 100;
        div.style.height = 100;
        div.innerHTML = text;
        div.style.top = -1000;
        div.style.left = -1000;

        this.element = div;
        document.body.appendChild(this.element);
    }
    /**
     * Entrypoint for updating the position
     */
    updatePosition() {
        let position = this.position.clone();

        var coords2d = this.get2DCoords(position, this.camera);
        this.element.style.left = coords2d.x + "px";
        this.element.style.top = coords2d.y + "px";
    }
    /**
     * Update the position by projecting the position onto the projection pane
     */
    get2DCoords(position, camera) {
        var vector = position.project(camera);
        vector.x = ((vector.x + 1) / 2) * window.innerWidth;
        vector.y = (-(vector.y - 1) / 2) * window.innerHeight;
        return vector;
    }
    /**
     * Hides the label
     */
    hide() {
        this.element.style.display = "none";
    }
    /**
     * Shows the label
     */
    show() {
        this.element.style.display = "block";
    }
}

export { Label };
