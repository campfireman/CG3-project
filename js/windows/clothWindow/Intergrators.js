

function integrateEuler(xOrg, dxOrg, dt) {
    let x = xOrg.clone();
    let dx = dxOrg.clone();

    return x.add(dx.multiplyScalar(dt));
}

function integrateRungeKutta(xOrg, dxOrg, h) {
    // let x = xOrg.clone();
    // let dx = dxOrg.clone();

    // let k_1 = 
    // let k_2 = 
    // let k_3 = 
    // let k_4 = 

    // return x + k_1.multiplyScalar(h / 6) + k_2.multiplyScalar(h / 3) + k_3.multiplyScalar(h / 3) + k_4.multiplyScalar(h / 6)
    let x = xOrg.clone();
    let dx = dxOrg.clone();

    return x.add(dx.multiplyScalar(dt));
}

export { integrateEuler, integrateRungeKutta };
