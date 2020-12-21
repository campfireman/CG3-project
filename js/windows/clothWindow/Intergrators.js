

function integrateEuler(xOrg, dxOrg, dt) {
    let x = xOrg.clone();
    let dx = dxOrg.clone();

    return x.add(dx.multiplyScalar(dt));
}

function integrateRungeKutta(xOrg, dxOrg, h) {
    // work in progress
    let x = xOrg.clone();
    let dx = dxOrg.clone();
    
    let h_2 = h/2;

    let k_1 = x
    let k_2 = x.clone().add(k_1.clone().multiplyScalar(h_2))
    let k_3 = x.clone().add(k_2.clone().multiplyScalar(h_2))
    let k_4 = x.clone().add(k_2.clone().multiplyScalar(h))

    return x.clone().add(k_1.multiplyScalar(h / 6).add(k_2.multiplyScalar(h / 3).add(k_3.multiplyScalar(h / 3).add(k_4.multiplyScalar(h / 6)))))
}

export { integrateEuler, integrateRungeKutta };
