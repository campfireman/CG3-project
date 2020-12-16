

class Spring {
    constructor(part1, part2, springKonstant, restLength) {
        this.part1 = part1;
        this.part2 = part2;
        this.springKonstant = springKonstant;
        this.restLength = restLength;
    }

    update(dt) {
        let pos1 = this.part1.pos.clone();
        let pos2 = this.part2.pos.clone();

        let direction =  pos1.sub(pos2);
        let displacement = direction.length() - this.restLength;
        //console.log(displacement);
        let force = direction.setLength(this.springKonstant * displacement);
        
        this.part2.applyForce(force);
        this.part1.applyForce(force.multiplyScalar(-1));
    }

    setRestLength(newLength) {
        this.restLength = newLength;
    }

}

export { Spring };