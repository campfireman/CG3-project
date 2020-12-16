

function integrateEuler(xOrg, dxOrg, dt) {
    let x = xOrg.clone();
    let dx = dxOrg.clone();

    return x.add(dx.multiplyScalar(dt));
}


export { integrateEuler };