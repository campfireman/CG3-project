

function integrateEuler(x, dx, dt) {
    let xCopy = x.clone();
    let dxCopy = dx.clone();

    return xCopy.add(dxCopy.multiplyScalar(dt));
}


export { integrateEuler };