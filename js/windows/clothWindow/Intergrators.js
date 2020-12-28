

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

function integrateEuler2(x, h) {
    let deriv = x.getDeriv();
    deriv.mul(h);
    x.add(deriv);
}

function integrateRungeKutta2(x, h) {
    // work in progress
    /*let x = xOrg.clone();
    let dx = dxOrg.clone();
    
    let h_2 = h/2;

    let k_1 = x
    let k_2 = x.clone().add(k_1.clone().multiplyScalar(h_2))
    let k_3 = x.clone().add(k_2.clone().multiplyScalar(h_2))
    let k_4 = x.clone().add(k_2.clone().multiplyScalar(h))

    return x.clone().add(k_1.multiplyScalar(h / 6).add(k_2.multiplyScalar(h / 3).add(k_3.multiplyScalar(h / 3).add(k_4.multiplyScalar(h / 6)))))*/

    let deriv1 = x.getDeriv(h);
    
    deriv1.mul(h / 2);
    let deriv2 = x.clone().add(deriv1).getDeriv(h/2);

    deriv2.mul(h / 2);
    let deriv3 = x.clone().add(deriv2).getDeriv(h/2);

    deriv3.mul(h);
    let deriv4 = x.clone().add(deriv3).getDeriv(h);
    console.log(deriv4);

    x.add(deriv1.mul(1 / 3)).add(deriv2.mul(2 / 3)).add(deriv3.mul(1 / 3)).add(deriv4.mul(1 / 6));
    
}

export { integrateEuler, integrateRungeKutta, integrateEuler2, integrateRungeKutta2 };
