

class Spring {

    constructor(part1, part2, restLength) {
        this.part1 = part1;
        this.part2 = part2;
        this.restLength = restLength;
    }

    update(dt) {

    }

    setRestLength(newLength) {
        this.restLength = newLength;
    }

}

export { Spring };