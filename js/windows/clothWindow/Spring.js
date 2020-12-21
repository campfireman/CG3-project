import * as THREE from "/three/three.module.js";
const COLOR_REST = '#0000ff';
const COLOR_STRETCHED = '#ff0000';
const COLOR_SQUEEZED = '#00ff00';

class Spring {
    constructor(part1, part2, springKonstant, restLength, scene) {
        this.part1 = part1;
        this.part2 = part2;
        this.springKonstant = springKonstant;
        this.restLength = restLength;
        this.scene = scene;
        this.updateDirection() 
        this.scene.add(this.createLine(COLOR_REST))
    }
    updateDirection() {
        let pos1 = this.part1.pos.clone();
        let pos2 = this.part2.pos.clone();

        this.direction =  pos1.sub(pos2);
    }
    update(dt) {
        this.updateDirection()
        let direction = this.direction.clone()
        let displacement = direction.length() - this.restLength;
        //console.log(displacement);
        let force = direction.setLength(this.springKonstant * displacement);
        
        this.part2.applyForce(force);
        this.part1.applyForce(force.multiplyScalar(-1));
    }
    createLine(color) {
        // this.geometry = new LineGeometry();
        // this.geometry.setPositions(
        //     [this.part1.pos.x, this.part1.pos.y, this.part1.pos.z, this.part2.pos.x, this.part2.pos.y, this.part2.pos.z]
        // )
        // let material = new LineMaterial({
        //     color: color,
        //     linewidth: 0.0015,
        //     vertexColors: false,
        // });
        // this.indicator = new Line2(this.geometry, material)

        this.geometry = new THREE.Geometry();
        this.geometry.vertices.push(
            this.part1.pos, this.part2.pos)
         
            this.indicator = new THREE.Line(this.geometry, new THREE.LineBasicMaterial({
            color: color
        }))
        this.scene.add(this.indicator);

        return this.indicator;
    }
    updateVisulization() {
        // this.geometry.setPositions(
        //     [this.part1.pos.x, this.part1.pos.y, this.part1.pos.z, this.part2.pos.x, this.part2.pos.y, this.part2.pos.z]
        // )
        // this.geometry.verticesNeedUpdate = true;
        // this.scene.remove(this.indicator);
        // // delete this.indicator;
        // this.scene.add(this.createLine(COLOR_REST))
        this.geometry.vertices.pop()
        this.geometry.vertices.pop()
        this.geometry.vertices.push(
            this.part1.pos, this.part2.pos)
        this.geometry.verticesNeedUpdate = true;
        let scale = this.clamp(this.direction.length() / this.restLength, 0, 2);
        let color = COLOR_REST;
        if (scale > 1) {
            color = COLOR_STRETCHED;
            scale = 1 - (scale - 1);
        } else if (scale < 1) {
            color = COLOR_SQUEEZED;
        }
        color = this.pSBC(scale, color, false, true)
        this.indicator.material = new THREE.LineBasicMaterial({
            color: color,
        })
    }
    clamp(value, min, max) {
        if (value > max) {
            return max;
        }
        if (value < min) {
            return min;
        }
        return value;
    }
    setRestLength(newLength) {
        this.restLength = newLength;
    }

    setSpringConstant(newSpringKonstant) {
        this.springKonstant = newSpringKonstant;
    }

    // Version 4.0
    pSBC(p,c0,c1,l){
        let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
        if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
        if(!this.pSBCr)this.pSBCr=(d)=>{
            let n=d.length,x={};
            if(n>9){
                [r,g,b,a]=d=d.split(","),n=d.length;
                if(n<3||n>4)return null;
                x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
            }else{
                if(n==8||n==6||n<4)return null;
                if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
                d=i(d.slice(1),16);
                if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
                else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
            }return x};
        h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pSBCr(c0),P=p<0,t=c1&&c1!="c"?this.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
        if(!f||!t)return null;
        if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
        else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
        a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
        if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
        else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
    }

}

export { Spring };
