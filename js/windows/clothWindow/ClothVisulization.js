import * as THREE from "/three/three.module.js";
const COLOR_REST = '#ffffff';
const COLOR_STRETCHED = '#ff0000';
const COLOR_SQUEEZED = '#00ff00';

class ClothVisulization {
    constructor(cloth) {
        this.cloth = cloth

        this.hidden = false;
        this.springs = [];

        for(let x = 0; x < this.cloth.width; x++) {
            this.springs.push([]);
            for(let y = 0; y < this.cloth.height; y++) {
                this.springs[x].push(Array(this.cloth.springs.length).fill(null));
                this.cloth.springs.forEach((spring, i) => {
                    let otherX = x + spring.x;
                    let otherY = y + spring.y;
                    if (otherX >= 0 && otherX <= this.cloth.width - 1 && otherY >= 0 && otherY <= this.cloth.height -1) {
                        let geometry = new THREE.Geometry();
                        geometry.vertices.push(
                            this.cloth.particles[x][y].position,
                            this.cloth.particles[otherX][otherY].position,
                        )
                         
                        let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
                            color: COLOR_REST,
                        }));
                        this.cloth.scene.add(line);
                        this.springs[x][y][i] = {
                            line: line,
                            geometry: geometry,
                            other: {
                                x: otherX,
                                y: otherY,
                            }
                        }
                    }
                });
            }
        }
    }
    hide() {
        this.hidden = true;
    }
    show() {
        this.hidden = false;
    }
    update() {
        if (this.hidden) {
            return;
        }
        for(let x = 0; x < this.cloth.width; x++) {
            for(let y = 0; y < this.cloth.height; y++) {
                this.cloth.springs.forEach((val, i) => {
                    let spring = this.springs[x][y][i];
                    if (spring == null) {
                        return;
                    }
                    spring.geometry.vertices.pop()
                    spring.geometry.vertices.pop()
                    let pos1 = this.cloth.particles[x][y].position;
                    let pos2 = this.cloth.particles[spring.other.x][spring.other.y].position;
                    let direction = pos1.clone().sub(pos2);
                    spring.geometry.vertices.push(
                        pos1, pos2,
                    )
                    spring.geometry.verticesNeedUpdate = true;
                    let scale = this.clamp(direction.length() / val.restingDistance, 0, 2);
                    let color = COLOR_REST;
                    if (scale > 1) {
                        color = COLOR_STRETCHED;
                        scale = 1 - (scale - 1);
                    } else if (scale < 1) {
                        color = COLOR_SQUEEZED;
                    }
                    color = this.pSBC(scale, color, false, true);
                    if (color == '#') {
                        return;
                    }
                    spring.line.material = new THREE.LineBasicMaterial({
                        color: color,
                    })
                });
            }
        }
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

    export { ClothVisulization };

