/**
 * Basic Euler-Integrator
 * @param {ClothState} x state which is to be integrated
 * @param {Number} h step size
 */
function integrateEuler(x, h) {
    let deriv = x.getDeriv(h);
    x.add(deriv);
}

/**
 * Runge-Kutta-Integrator
 * @param {ClothState} x state which is to be integrated
 * @param {Number} h step size
 */
function integrateRungeKutta(x, h) {
    let deriv1 = x.getDeriv(h);

    deriv1.mul(1 / 2);
    let deriv2 = x.clone().add(deriv1).getDeriv(h);

    deriv2.mul(1 / 2);
    let deriv3 = x.clone().add(deriv2).getDeriv(h);

    deriv3.mul(1);
    let deriv4 = x.clone().add(deriv3).getDeriv(h);

    x.add(deriv1.mul(1 / 3))
        .add(deriv2.mul(2 / 3))
        .add(deriv3.mul(1 / 3))
        .add(deriv4.mul(1 / 6));
}

export { integrateEuler, integrateRungeKutta };
