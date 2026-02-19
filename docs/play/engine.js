'use strict';
const VC={};

VC.Math = class {
    static constrain (min, val, max){
        if (isNaN(val)) val = 0;
        if (val===undefined) val = 0;
        if (val===null) val = 0;
        if (val<min) return min;
        if (val>max) return max;
        return val;
    }

    static percentToRange (percentage, rangeMin, rangeMax){
        percentage = VC.Math.constrain(0, percentage, 1);
        return rangeMin + (percentage * (rangeMax-rangeMin));
    }

    static inversePercentToRange (percentage, rangeMin, rangeMax){
        percentage = VC.Math.constrain(0, percentage, 1);
        return rangeMax - (percentage * (rangeMax-rangeMin));
    }

    static random(min, max){
        return Math.floor(Math.random() * (max - min +1)) + min;
    }

    static greatestCommonDivisor(a, b) {
        while (b !== 0) {
            let t = b;
            b = a % b;
            a = t;
        }
        return a;
    }


}

VC.Paragraph =  class {
    #text = "";
    #fontFamily = "monospace";
    #fontSize = "12px";
    #fontWeight = "normal";
    #wrapWidth = 400;
    #element = null;
    #fill = "#FFF";

    constructor(text, fontFamily, fontSize, fontWeight, fill, wrapWidth){
        this.#text = text;
        this.#fontFamily = fontFamily;
        this.#fontSize = fontSize;
        this.#fontWeight = fontWeight
        this.#wrapWidth = wrapWidth;
        this.#fill = fill;
    }

    render(screen){
        if(!this.#element){
                
            let words = this.#text.split(" ");
            let composite = "";
            this.#element = screen.text(-10000, -10000, composite);
            this.#element.attr({"font-size": this.#fontSize, "font-family": this.#fontFamily, "font-weight": this.#fontWeight, "fill": this.#fill})

            for(let w = 0; w < words.length; w++){
                this.#element.attr("text", composite + " " + words[w]);
                let width = this.#element.getBBox().width;
                if(width <= this.#wrapWidth){
                    composite += " " + words[w];
                    continue;
                }
                this.#element.attr("text", composite + "\n" + words[w]);
                width = this.#element.getBBox().width;
                if(width <= this.#wrapWidth){
                    composite += "\n" + words[w];
                    continue;
                }
                composite += "%" + w + "%\n" //handle words too long for line (poorly)
            }
            for(let w = 0; w < words.length; w++){
                composite = composite.replace("%" + w + "%",words[w]);
            }
            
            this.#element.attr("text", composite);
        }
        return this.#element
    }

}

VC.Point = class {
    #element = null;
    x = 0;
    y = 0;
    constructor (x,y){
        this.x = x;
        this.y = y;
    }
    render(screen, color){
        if(!color){
            color = "#FFF";
        }
        if (this.#element){
            this.remove();
        }
        this.#element = screen.drawRect(this.x-1,this.y-1, 3, 3, color,"#000",0);
        screen.onClear(this.remove)
    }
    remove(){
        if(this.#element){
            this.#element.remove();
            this.#element = null;
        }
    }
    
    toString(){
        return `(${this.x}, ${this.y})`
    }
    
    distanceTo(point){
        return VC.Trig.distance(this.x, this.y, point.x, point.y);
    }

    static vector(point1, point2){
        return new VC.Point(point2.x - point1.x, point2.y - point1.y);
    }

    static normalizeDirection(point){
        let gcd = VC.Math.greatestCommonDivisor(Math.abs(point.x), Math.abs(point.y));
        return new VC.Point(point.x / gcd, point.y / gcd);
    }
    static normalizeToUnit(point){
        let mag = Math.hypot(point.x, point.y);
        if (mag === 0) return new VC.Point(0, 0);
        return new VC.Point(point.x / mag, point.y / mag);
    }
}

VC.Scene = class {
    transitionTo = null;
    preDisplay(){}
    preRender(deltaT){}
    render(deltaT, screen){}
    postRender(deltaT){}
    postDisplay(){}
}

VC.Trig = class {
    static degreesToRadians(angle){
        return (angle % 360) / 360 * 2 * Math.PI;
    }
    static radiansToDegrees(angle){
        return angle * 57.2958;
    }
    static cotangent(radians){
        return 1/Math.tan(radians);
    }
    static tangent(radians){
        return Math.tan(radians);
    }
    static pointToAngle(opposite, adjacent){
        if(adjacent<0){
            return Math.PI + Math.atan(opposite/adjacent);        
        }
        return Math.atan(opposite/adjacent);
    }
    static distance (x1, y1, x2, y2){
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    static tangentFromPoints(x1,y1,x2,y2){
        return (y2-y1)/(x2-x1);
    }

    // Angle (in degrees) between two vectors
    static angleBetweenVectors(v1, v2) {
        let dot = v1.x * v2.x + v1.y * v2.y;
        let mag1 = Math.hypot(v1.x, v1.y);
        let mag2 = Math.hypot(v2.x, v2.y);

        if (mag1 === 0 || mag2 === 0) return 0;

        let cosTheta = dot / (mag1 * mag2);
        // Clamp to handle tiny floating point errors
        cosTheta = Math.max(-1, Math.min(1, cosTheta));

        return Math.round(Math.acos(cosTheta) * 180 / Math.PI);
    }

}

VC.VisualEffects = class {
    //Todo: refactor
    static shaking = false
    static shake(screen, intensity, ms){
        var rate = 50;
        var div =  document.getElementById(screen.domElementId);
        div.style.top = Math.round(Math.random() * intensity * (Math.random()>.5 ? 1 : -1)) +'px';
        div.style.left = Math.round(Math.random() * intensity * (Math.random()>.5 ? 1 : -1)) + 'px';

        if(ms>0){
            setTimeout(()=>{VC.VisualEffects.shake(screen, intensity, ms-rate);},rate)
            VC.VisualEffects.shaking=true;
        }else{
            div.style.top = 0;
            div.style.left = 0;
            VC.VisualEffects.shaking=false;
        }
    }
}
VC.AudioChannel = class{
    #player = null;    
    #volume = 1;
    #relativeVolume = 1;
    #relativePan = 0;
    #uri = "";
    #fadeOutCancellationToken = null;
    #index = 0;

    #setVolume(){
        if(this.#player && this.#player instanceof Howl){
            this.#player.volume(this.#volume * this.#relativeVolume);
            this.#player.stereo(this.#relativePan);
            //this.#player.mute(false);
        }
    }
    get player(){
        return this.#player;
    }

    get volume(){
        return this.#volume;
    }

    set volume(value){
        value = value < 0 ? 0 : (value > 1 ? 1 : value);
        if(this.#volume !== value){
            this.#volume = value;
            this.#setVolume();
        }
    }

    get relativeVolume(){
        return this.#relativeVolume;
    }

    set relativeVolume(value){
        value = value < 0 ? 0 : (value > 1 ? 1 : value);
        if(this.#relativeVolume !== value){
            this.#relativeVolume = value;
            this.#setVolume();
        }
    }

    get relativePan(){
        return this.#relativePan;
    }

    set relativePan(value){
        value = value < -1 ? -1 : (value > 1 ? 1 : value);
        if(this.#relativePan !== value){
            this.#relativePan = value;
            this.#setVolume()
        }
    }

    playNext(){
        console.log("playnext")
        this.play(this.#uri, this.volume, true, this.#index+1);
    }
    
    play(uri, volume, loop, index){

        if(index == null){
            index = 0;
        }
        if(this.#fadeOutCancellationToken){
            window.clearTimeout(this.#fadeOutCancellationToken);
            
            if(this.#player && this.#player instanceof Howl && this.#player.playing()){
                this.#player.stop();
            } 
            this.#fadeOutCancellationToken = null;
        }

        this.volume = volume;
        
        if(this.#player && this.#player instanceof Howl && this.#uri === uri && !this.#player.playing() && index == this.#index){
            this.#player.play();
            return;
        }

        if(this.#player && this.#player instanceof Howl && (this.#uri !== uri || index !== this.#index)){
            this.dispose();
        }

        if(!this.#player){
            if(Array.isArray(uri)){
                this.#player = new Howl({
                    src: [uri[index]],
                    format: "mp3",
                    autoplay: true, 
                    loop: index==uri.length-1,
                    stereo: this.#relativePan,
                    volume: this.#volume * this.relativeVolume,
                    onend: index==uri.length-1 ? null : this.playNext.bind(this)
                });    
            } else {
                this.#player = new Howl({
                    src: [uri],
                    format: "mp3",
                    autoplay: true,
                    loop: false,
                    stereo: this.#relativePan,
                    volume: this.#volume * this.relativeVolume,
                    onend: loop ? ()=>{
                        if(this.player){
                            this.player.stop().play();         
                        }
                    } : null
                });    
            }
            
        }
        this.#uri = uri;
        this.#index = index;
    }
  
    stop(uri){
        if(uri && this.#uri !== uri){
            //already playing something else. 
            return;
        } 
        if(this.#player!=null && this.#player.playing()){
            this.#player.stop(); 
        }
    }
  
    fadeOut(callback){
        if(this.#player){
            if( this.volume > 0){
                this.volume-=.1;
                this.#fadeOutCancellationToken = setTimeout(()=>{this.fadeOut(callback)}, 75);
            }else {
                this.#player.stop();
                if(callback){
                    callback();
                }
            }
        } else if (callback){
            callback();
        }
    };
    
    dispose(){
        if(this.#player && this.#player instanceof Howl){
            if (this.#player.playing()) {
                this.#player.stop();
            }
            this.#player.unload();  
            this.#player = null;
        }
    }
}

VC.Color = class {
    static hexToRGB(hexColor){
        if(hexColor.length===6 || hexColor.length == 3){
            hexColor = "#" + hexColor
        }
        let red = "00";
        let green = "00";
        let blue = "00"
        if(hexColor.length === 4){
            red = hexColor.substring(1,2);
            red += red;
            green = hexColor.substring(2,3);
            green += green;
            blue = hexColor.substring(3,4);
            blue += blue;
        }
        if(hexColor.length === 7){
            red = hexColor.substring(1,3);
            green = hexColor.substring(3,5);
            blue = hexColor.substring(5,7);
        }

        return {
            r: parseInt(red,16),
            g: parseInt(green,16),
            b: parseInt(blue,16)
        }
    }

    static rgbToHex(rgb){
        let hex="#"
        hex += right("0" + rgb.r.toString(16),2);
        hex += right("0" + rgb.g.toString(16),2);
        hex += right("0" + rgb.b.toString(16),2);
        return hex;
    }

    static calculateAlpha(backgroundHex, foregroundHex, foregroundOpacity){
        //alpha * new + (1 - alpha) * old
        let backgroundRGB = VC.Color.hexToRGB(backgroundHex);
        let foregroundRGB = VC.Color.hexToRGB(foregroundHex);
        return VC.Color.rgbToHex({
            r: Math.round(foregroundRGB.r * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.r),
            g: Math.round(foregroundRGB.g * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.g),
            b: Math.round(foregroundRGB.b * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.b)
        });
    }
}
VC.GameState = class {
    static get PAUSED(){
        return 0;
    }
    static get RUNNING(){
        return 1;
    }
}

VC.LineSegment = class {
    #element = null;
    point1 = null;
    point2 = null;
    constructor (point1, point2){
        if(point1 && point1 instanceof VC.Point){
            this.point1 = point1;
        }
        if(point2 && point2 instanceof VC.Point){
            this.point2 = point2;
        }
    }
    get length() {
        return this.point1.distanceTo(this.point2);
    }
    pointOfIntersection(lineSegment) {
        if (!(lineSegment && lineSegment instanceof VC.LineSegment)){
            console.warn("lineSegment argument is not an instance of VC.LineSegment")
            return null;
        }
        let x1 = this.point1.x;
        let y1 = this.point1.y;
        let x2 = this.point2.x;
        let y2 = this.point2.y;
        let x3 = lineSegment.point1.x;
        let y3 = lineSegment.point1.y;
        let x4 = lineSegment.point2.x;
        let y4 = lineSegment.point2.y;


        let denom = ((x1-x2) * (y3-y4)) - ((y1-y2) * (x3-x4));
        if(denom == 0){ // Parallel, return null
            return null;
        }
        let t = (((x1-x3) * (y3-y4)) - ((y1-y3) * (x3-x4)))/ denom;
        let u = -((((x1-x2) * (y1-y3)) - ((y1-y2) * (x1-x3)))/ denom);
        if (0<=t && t<=1 && 0<=u && u<=1){
            //return point of intersection
            return new VC.Point(x1 + (t *(x2 - x1)), y1 + (t * (y2 - y1)));
        }
        //line segments do not intersect
        return null;
    }

    pointOfReflection(point){
        const dx = this.point2.x - this.point1.x;
        const dy = this.point2.y - this.point1.y;

        const apx = point.x - this.point1.x;
        const apy = point.y - this.point1.y;

        const dot = apx * dx + apy * dy;
        const lenSq = dx * dx + dy * dy;

        const t = dot / lenSq;

        const qx = this.point1.x + t * dx;
        const qy = this.point1.y + t * dy;

        return new VC.Point (
            2 * qx - point.x,
            2 * qy - point.y
        );
    }
    render(screen, color){
        return screen.drawLine(this.point1.x, this.point1.y, this.point2.x, this.point2.y, color, 2);
    }
}
VC.Polygon = class {
    #element = null;
    #registered = false;
    #lineSegments = [];
    constructor(...points) {
        let sortPoints = true;
        if (points.length === 1 && Array.isArray(points[0])) {
            this.points = points[0]; // If an array of points is passed
        } else if (points.length === 2 && Array.isArray(points[0]) && points[1]==true) {
            this.points = points[0]; // If an array of points is passed
            sortPoints = false;
        } else {
            this.points = points; // If individual points are passed
        }

        //validate only VC.Point are passed in
        this.points.forEach(element => {
            if(!(element instanceof VC.Point)){
                throw ("All elements passed in must be of type VC.Point!");
            }
        });
        if(sortPoints){
            this.sortPoints();
        }
    }

    area(){
        let n = this.points.length;
        if (n < 3) return 0; // A polygon must have at least 3 points

        //Shoelace Theorem
        let sum = 0;
        for (let i = 0; i < n; i++) {
            let p1 = this.points[i];
            let p2 = this.points[(i + 1) % n]; // Wrap around for last edge
            sum += p1.x * p2.y - p2.x * p1.y;
        }

        return Math.abs(sum) / 2;
    }

    sortPoints(){
        console.log("sorting points")
        // Remove duplicates
        let uniquePoints = Array.from(new Map(this.points.map(p => [`${p.x},${p.y}`, p])).values());

        // Find centroid (average x, y)

        let maxX = null;
        let minX = null;
        let maxY = null;
        let minY = null;

        uniquePoints.forEach(point=>{
            maxX = maxX == null || point.x>maxX ? point.x : maxX;
            maxY = maxY == null || point.y>maxY ? point.y : maxY;
            minX = minX == null || point.x<minX ? point.x : minX;
            minY = minY == null || point.y<minY ? point.y : minY;
        })

        const centroid = new VC.Point(minX+maxX, minY+maxY);    
        centroid.x /= 2;
        centroid.y /= 2;
        
        // Sort points in clockwise order
        uniquePoints.sort((a, b) => {
            const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
            const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
            return  angleB - angleA ; // Clockwise order
        });

        this.points = uniquePoints;
        this.#lineSegments = [];
    }

    getBounds() {
        let xMin = Math.min(...this.points.map(p => p.x));
        let xMax = Math.max(...this.points.map(p => p.x));
        let yMin = Math.min(...this.points.map(p => p.y));
        let yMax = Math.max(...this.points.map(p => p.y));
    
        return { xMin, xMax, yMin, yMax };
    }
    

    getBoundingBox() {
        let b = this.getBounds();
        return new VC.Box(b.xMin, b.yMin, b.xMax-b.xMin, b.yMax-b.yMin);
    }
    

    #isClockwise() {
        let sum = 0;
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];
            sum += (p2.x - p1.x) * (p2.y + p1.y);
        }
        return sum > 0;
    }

    static #lineIntersection(p1, p2, p3, p4) {
        const A1 = p2.y - p1.y;
        const B1 = p1.x - p2.x;
        const C1 = A1 * p1.x + B1 * p1.y;

        const A2 = p4.y - p3.y;
        const B2 = p3.x - p4.x;
        const C2 = A2 * p3.x + B2 * p3.y;

        const det = A1 * B2 - A2 * B1;
        if (Math.abs(det) < 1e-10) return null;

        return new VC.Point(
            (B2 * C1 - B1 * C2) / det,
            (A1 * C2 - A2 * C1) / det
        );
    }

    getOffset(distance) {
        const n = this.points.length;
        if (n < 3) return this;

        const clockwise = this.#isClockwise();
        const sign = clockwise ? -1 : 1;

        const shiftedEdges = [];

        for (let i = 0; i < n; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % n];

            // Edge vector
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);

            // Unit outward normal
            let nx = sign * dy / len;
            let ny = sign * -dx / len;

            // Shifted edge points
            const sp1 = new VC.Point(
                p1.x + nx * distance,
                p1.y + ny * distance
            );

            const sp2 = new VC.Point(
                p2.x + nx * distance,
                p2.y + ny * distance
            );

            shiftedEdges.push([sp1, sp2]);
        }

        const newPoints = [];

        for (let i = 0; i < n; i++) {
            const prev = shiftedEdges[(i - 1 + n) % n];
            const curr = shiftedEdges[i];

            const intersect = VC.Polygon.#lineIntersection(
                prev[0], prev[1],
                curr[0], curr[1]
            );

            if (intersect) newPoints.push(intersect);
        }
        var result = new VC.Polygon(newPoints, true);
        result.cleanSelfIntersections();

        //result.sortPoints();

        return result;
    }

    truncateEdgesLessThan(length){
        let found = false;
        this.lineSegments.filter((ls)=>ls.length<=length).forEach((ls)=>{
            found = true;
            if(ls.point1.x==ls.point2.x || ls.point1.y == ls.point2.y){
                remove(this.points, (p)=>{return (p.x == ls.point1.x && p.y==ls.point1.y) || (p.x==ls.point2.x && p.y == ls.point2.y)})
            }
        });
        this.#lineSegments = [];
    }

    cleanSelfIntersections() {
        const scale = 1000; // Clipper uses integers

        const path = this.points.map(p => ({
            X: Math.round(p.x * scale),
            Y: Math.round(p.y * scale)
        }));

        const clipper = new ClipperLib.Clipper();
        clipper.AddPath(path, ClipperLib.PolyType.ptSubject, true);

        const solution = new ClipperLib.Paths();

        clipper.Execute(
            ClipperLib.ClipType.ctUnion,
            solution,
            ClipperLib.PolyFillType.pftNonZero,
            ClipperLib.PolyFillType.pftNonZero
        );

        // Take the largest resulting polygon
        const largest = solution.sort((a,b) => b.length - a.length)[0];

        this.points = largest.map(p =>
            new VC.Point(p.X / scale, p.Y / scale)
        );

        this.#lineSegments = [];
    }


    #boundingBoxesOverlap(shape) {
        let b1 = this.getBounds();
        let b2 = shape.getBounds();
    
        return !(b1.xMax < b2.xMin || b1.xMin > b2.xMax || b1.yMax < b2.yMin || b1.yMin > b2.yMax);
    }

    #doLinesIntersect(p1, p2, q1, q2) {
        function crossProduct(v1, v2) {
            return v1.x * v2.y - v1.y * v2.x;
        }
    
        let v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        let v2 = { x: q2.x - q1.x, y: q2.y - q1.y };
    
        let d1 = crossProduct({ x: q1.x - p1.x, y: q1.y - p1.y }, v1);
        let d2 = crossProduct({ x: q2.x - p1.x, y: q2.y - p1.y }, v1);
        let d3 = crossProduct({ x: p1.x - q1.x, y: p1.y - q1.y }, v2);
        let d4 = crossProduct({ x: p2.x - q1.x, y: p2.y - q1.y }, v2);
    
        return (d1 * d2 < 0) && (d3 * d4 < 0);
    }



    isPointInsidePolygon(point, points) {
        if(!points){
            points = this.points;
        }
        let { x, y } = point;
        let inside = false;
    
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            let xi = points[i].x, yi = points[i].y;
            let xj = points[j].x, yj = points[j].y;
    
            let intersect = ((yi > y) !== (yj > y)) &&
                            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    
        return inside;
    }

    subdivide(cellSize = 8) {
        const boxes = [];
        const b = this.getBounds();

        for (let x = b.xMin; x < b.xMax; x += cellSize) {
            for (let y = b.yMin; y < b.yMax; y += cellSize) {
                const cx = x + cellSize / 2;
                const cy = y + cellSize / 2;

                if (this.containsPoint(new VC.Point(cx, cy))) {
                    boxes.push(new VC.Box(x, y, cellSize, cellSize));
                }
            }
        }

        return boxes;
    }

    #grid = null;
    get grid(){
        if(!this.#grid){
            this.#grid = this.subdivide(10);
        }
        return this.#grid;
    }
   
    resolveCollision(box) {
        let dx = 0;
        let dy = 0;

        const boxes = this.subdivide(8);

        for (const b of boxes) {
            const oldX = b.x;
            const oldY = b.y;

            b.resolveCollision(box);

            dx += b.x - oldX;
            dy += b.y - oldY;
        }

        // Apply average displacement to polygon
        dx /= boxes.length || 1;
        dy /= boxes.length || 1;

        box.x -= dx;
        box.y -= dy;
    
        this.#lineSegments = [];
    }


    intersectsWith(shape) {
        let s1 = this.points;
        let s2 = shape.points;  
    
        for (let i = 0; i < s1.length; i++) {
            let p1 = s1[i];
            let p2 = s1[(i + 1) % s1.length];
    
            for (let j = 0; j < s2.length; j++) {
                let q1 = s2[j];
                let q2 = s2[(j + 1) % s2.length];
    
                if (this.#doLinesIntersect(p1, p2, q1, q2)) {
                    return true;
                }
            }
        }
    
        return false;
    }

    fullyContains(shape) {
        return all(shape.points, point => this.isPointInsidePolygon(point, this.points));
    }

    contains(shape) {
        return shape.points.some(point => this.isPointInsidePolygon(point, this.points)) ||
               this.points.some(point => this.isPointInsidePolygon(point, shape.points));
    }
    containsPoint(point){
        return this.isPointInsidePolygon(point, this.points);
    }

    collidesWith(shape) {
        return this.#boundingBoxesOverlap(shape) &&
               (this.intersectsWith(shape) || this.contains(shape));
    }

    get lineSegments(){
        if (this.#lineSegments.length == 0){
          let len = this.points.length;
            for(let i = 0; i < len; i++){
                this.#lineSegments.push(new VC.LineSegment(this.points[i], this.points[(i + 1) % len]));
            }
        }
        return this.#lineSegments;
    }

    pointOfIntersection(lineSegment){

        let point1Inside = this.isPointInsidePolygon(lineSegment.point1, this.points);
        let point2Inside = this.isPointInsidePolygon(lineSegment.point2, this.points);

        //both points ouside, return null
        if(!(point1Inside || point2Inside)){
            return null;
        }

        let origin = lineSegment.point1;
        if (point2Inside && !point1Inside){
            origin = lineSegment.point2;
        }

        var points=[];
        for(var l=0; l<this.lineSegments.length; l++){
            let point = this.lineSegments[l].pointOfIntersection(lineSegment);
            if(point){
                points.push(point);
            }
        }
        if(points.length == 0){
            return null;
        }
        if(points.length == 1){
            return points[0];
        }
        return minValue(points, (p) => {return VC.Trig.distance(origin.x, origin.y, p.x, p.y)});

    }
    

    render(screen, color){
        if(!this.#registered){
            screen.onClear(this.remove);
            this.#registered = true;
        }
        this.remove();
        this.#element = screen.drawPoly(this.points, null, color, 1);
        return this.#element;
    }
    
    remove(){
        if(this.#element){
            this.#element.remove();
            this.#element = null;
        }   
    }

    subtract(inner) {
        if (!this.fullyContains(inner)) {
            throw new Error("Inner polygon must lie inside outer polygon.");
        }

        const outer = this.points;
        const innerPts = [...inner.points].reverse(); // reverse winding

        // 1. Find rightmost inner point
        let innerIndex = 0;
        for (let i = 1; i < innerPts.length; i++) {
            if (innerPts[i].x > innerPts[innerIndex].x) {
                innerIndex = i;
            }
        }

        const anchor = innerPts[innerIndex];

        // 2. Cast ray right and find intersection with outer edges
        let bestIntersection = null;
        let outerIndex = -1;

        for (let i = 0; i < outer.length; i++) {
            const p1 = outer[i];
            const p2 = outer[(i + 1) % outer.length];

            const intersect = this.#horizontalRayIntersect(anchor, p1, p2);

            if (intersect && (!bestIntersection || intersect.x < bestIntersection.x)) {
                bestIntersection = intersect;
                outerIndex = i;
            }
        }

        if (!bestIntersection) {
            throw new Error("Failed to create bridge.");
        }

        // 3. Build new vertex array
        const newPoints = [];

        // Outer up to bridge
        for (let i = 0; i <= outerIndex; i++) {
            newPoints.push(outer[i]);
        }

        newPoints.push(bestIntersection);

        // Inner loop
        for (let i = 0; i < innerPts.length; i++) {
            newPoints.push(innerPts[(innerIndex + i) % innerPts.length]);
        }
        newPoints.push(anchor);
        newPoints.push(bestIntersection);

        // Continue outer
        for (let i = outerIndex + 1; i < outer.length; i++) {
            newPoints.push(outer[i]);
        }

        return new VC.Polygon(newPoints, true); // no re-sort
    }
 

    #horizontalRayIntersect(origin, p1, p2) {
        if ((p1.y > origin.y) !== (p2.y > origin.y)) {
            const x = p1.x + (origin.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y);
            if (x > origin.x) {
                return new VC.Point(x, origin.y);
            }
        }
        return null;
    }
}

VC.Screen = class {
    #screen = null;
    #x = 0;
    #y = 0;
    #width = 0;
    #height = 0;
    #domElementId = "";
    constructor(domElementId, x, y, width, height){
        let screen = Raphael(domElementId, width, height);
        screen.setViewBox(x, y, width, height, true);
        screen.canvas.setAttribute('preserveAspectRatio', 'meet');
        screen.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
        this.#screen = screen;
        this.#width = width;
        this.#height = height;
        this.#x = x;
        this.#y = y;
        this.#domElementId = domElementId;
    }
    get domElementId(){
        return this.#domElementId;
    }
    get x(){
        return this.#x;
    }
    get y(){
        return this.#y;
    }
    get height(){
        return this.#height;
    }
    get width(){
        return this.#width;
    }

    group(){
        return this.#createGroup(arguments);
    };

    drawLine(x1,y1,x2,y2,color,thickness){
        let path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
        return this.#screen.path(path).attr({"stroke-width": thickness, "stroke":color});
    };

    drawTriangle(x1,y1,x2,y2,x3,y3, translateX, translateY, fillColor, strokeColor, thickness){
        let path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "Z";
        return this.#screen.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };
    
    drawRect(x,y,w,h,color,strokecolor, thickness, radius){
        if(isNaN(radius)){
            radius=0;
        }
        return this.#screen.rect(x,y,w,h,radius).attr({"stroke-width": thickness, "stroke":strokecolor, "fill": color});
    };

    drawQuad(x1,y1,x2,y2,x3,y3,x4,y4, translateX, translateY, fillColor, strokeColor, thickness){
        let path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "L" + (x4 + translateX) + "," + (y4 + translateY) + "Z";
        return this.#screen.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };

    drawPoly(points, fillColor, strokeColor, thickness){
        let path = ""
        for(let p=0; p < points.length;p++){
            if(p === 0){
                path = "M";
            }else {
                path = path + "L";
            }
            let point = points[p];
            path = path + point.x + "," + point.y;
        }
        path = path + "Z";
        let result = this.#screen.path(path);
        result.attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor})
        return result;
    }

    drawEllipse (x1,y1,r1,r2, translateX, translateY, fillColor, strokeColor, thickness){
        let e = this.#screen.ellipse(x1+translateX, y1+translateY, r1, r2)
        e.attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
        return e;
    };

    drawAngleSegmentX(angle, startX, endX, translateX, translateY, color, thickness){
        let startY = Math.round(VC.Trig.tangent(angle) * startX);
        let endY = Math.round(VC.Trig.tangent(angle) * endX);
        startX+=translateX; endX += translateX;
        startY+=translateY; endY += translateY;
        return this.drawLine(startX, startY, endX, endY, color, thickness);
    };
    
    drawAngleSegmentY = function(angle, startY, endY, translateX, translateY, color, thickness){
        let startX = Math.round(VC.Trig.cotangent(angle) * startY);
        let endX = Math.round(VC.Trig.cotangent(angle) * endY);
        startX+=translateX; endX += translateX;
        startY+=translateY; endY += translateY;
        return this.drawLine(startX, startY, endX, endY, color, thickness);
    }

    #clearListeners = [];
    clear(){
        this.#clearListeners.forEach((f)=>{
            try{
                f();
            } catch(e){
                console.log(e);
            }
        });
        this.#clearListeners = [];
        this.#screen.clear();
    }

    onClear(handler){
        //register handler
        this.#clearListeners.push(handler);
    }

    fadeTo(color, callback){
        let rect = this.drawRect(0,0,this.#width, this.#width, color, color, 0)
        rect.attr({opacity: 0})
        rect.animate({opacity:1}, 350, null, ()=>{rect.remove(); callback()});
    }
    
    fadeInFrom(color, callback){
        let rect = this.drawRect(0,0,this.#width, this.#width, color, color, 0)
        rect.attr({opacity: 1})
        rect.animate({opacity:0}, 350, null, ()=>{rect.remove(); callback()});
    }

    get svgNS(){
        return "http://www.w3.org/2000/svg";
    }
    
    get defs(){
        let dv = document.getElementById(this.#domElementId);
        let svg = dv.getElementsByTagName("svg")[0];
        let defs = svg.getElementsByTagName("defs");
        if(defs.length==1){
            let def = document.createElementNS(this.svgNS, "defs")
            svg.appendChild(def)
            console.log("creating new def")
            console.log(def);
            return def;
        }
        return defs[1];
    }

    
    #createGroup(g) {
		if(Raphael.svg == true) {
			let dv = document.getElementById(this.#domElementId);
			let defs = dv.getElementsByTagName("defs")[0];
			var svgHead = this.svgNS;
			let svgcanv = dv.getElementsByTagName("svg")[0];
			svgcanv.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
			var countGroups = svgcanv.getElementsByTagName("g").length;
			var createUUID=function(b,a){return function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(b,a).toUpperCase()}}(/[xy]/g,function(b){var a=16*Math.random()|0;return("x"==b?a:a&3|8).toString(16)});		
			let masterGroup = null;
            if(countGroups == 0) {
				masterGroup = document.createElementNS(this.svgNS, "g");
				svgcanv.appendChild(masterGroup)
			}else {
				masterGroup = svgcanv.getElementsByTagName("g")[0]
			}		
			let group = document.createElementNS(this.svgNS, "g");
			for(let i = 0;i < g.length;i++) {
                if(g[i] instanceof Node){
				    group.appendChild(g[i])
                }else if(g[i].node instanceof Node){
				    group.appendChild(g[i].node)
                }else{
                    console.warn(g[i]);
                }
			}
			masterGroup.appendChild(group);
			group.set = [];
			var _mg = masterGroup;
			group.getMaster = function() {
				return _mg
			};
			group.remove = function() {
				this.parentNode.removeChild(this)
			};
			var thisTransform = {translate:{x:0, y:0}, scale:{x:1, y:1}, rotate:{x:0, y:0, z:0}};
			var transformString = function() {
				return"translate(" + thisTransform.translate.x + "," + thisTransform.translate.y + ") scale(" + thisTransform.scale.x + "," + thisTransform.scale.y + ") rotate(" + thisTransform.rotate.x + "," + thisTransform.rotate.y + "," + thisTransform.rotate.z + ")"
			};
			group.translate = function(c, a) {
				thisTransform.translate.x = c;
				thisTransform.translate.y = a;
				this.setAttribute("transform", transformString())
			};
			group.rotate = function(c, a, e) {
				thisTransform.rotate.x = c;
				thisTransform.rotate.y = a;
				thisTransform.rotate.z = e;
				this.setAttribute("transform", transformString())
			};
			group.scale = function(c, a) {
				thisTransform.scale.x = c;
				thisTransform.scale.y = a;
				this.setAttribute("transform", transformString())
			};
			group.push = function() {
				for(let i = 0;i < arguments.length;i++) {
					this.appendChild(arguments[i].node)
				}
			};
			group.addElement = function() {
                //console.log("adding")
				for(let i = 0;i < arguments.length;i++) {
                    if(arguments[i] instanceof Node){
                        this.appendChild(arguments[i])
                    }else if(arguments[i].node instanceof Node){
                        this.appendChild(arguments[i].node)
                    }else {
                        console.log("nothing to add!")
                    }
				}
			    this.set = [];
			};
			group.getAttr = function(c) {
				return thisTransform[c]
			};
			group.copy = function(el) {
				this.copy = el.node.cloneNode(true);
				this.appendChild(this.copy)
			};
			group.toFront = function(){
				//this.getParent().appendChild(this);
			};
			group.clipPath = function(c){						
				var cp = document.createElementNS(svgHead, "clipPath");
				var cpID = createUUID();
				cp.setAttribute("id",cpID);
				cp.appendChild(c.node);
				defs.appendChild(cp);
				this.setAttribute("clip-path","url(#"+cpID+")")
                return cp;
			};

	
			return group
		}
    }

    //RAPHAEL PASS-THRU

    get bottom(){
        return this.#screen.bottom;
    }

    circle(x, y, r){
        return this.#screen.circle(x, y, r);
    }

    get canvas(){
        return this.#screen.canvas;
    }

    get customAttributes(){
        return this.#screen.customAttributes;
    }

    ellipse(x, y, rx, ry){
        return this.#screen.ellipse(x, y, rx, ry);
    }

    forEach(callback, thisArg){
        return this.#screen.forEach(callback, thisArg);
    }

    getById(id){
        return this.#screen.getById(id);
    }

    getElementByPoint(x, y){
        return this.#screen.getElementByPoint(x, y);
    }

    getFont(family, weight, style, stretch){
        return this.#screen.getFont(family, weight, style, stretch);
    }

    image(src, x, y, width, height){
        return this.#screen.image(src, x, y, width, height);
    }

    path(pathString){
        return this.#screen.path(pathString);
    }
    
    print(x, y, text, font, size, origin, letter_spacing){
        return this.#screen.print(x, y, text, font, size, origin, letter_spacing)
    }

    get raphael(){
        return this.#screen.raphael
    }

    rect(x, y, width, height, r){
        return this.#screen.rect(x, y, width, height, r)
    }

    remove(){
        return this.#screen.remove();
    }

    renderfix(){
        return this.#screen.renderfix();
    }

    safari(){
        return this.#screen.safari();
    }

    set(){
        return this.#screen.set();
    }

    setFinish(){
        return this.
        #screen.setFinish();
    }

    setSize(width, height){
        return this.#screen.setSize(width, height);
    }

    setStart(){
        return this.#screen.setStart();
    }

    setViewBox(x, y, w, h, fit){
        //this.#width = w;
        //this.#height = h;
        return this.#screen.setViewBox(x, y, w, h, fit);
    }

    text(x, y, text){
        return this.#screen.text(x, y, text)
    }

    get top(){
        return this.#screen.top;
    }


}

VC.Sprite = class {
    #scaleX = 1;
    #scaleY = 1;
    #screen = null;
    #forceRender = false;
    #image = {
        frameset: null, 
        width: 0,
        height: 0
    };
    #size = {
        width: 0,
        height: 0
    };
    #location = {
        x: 0,
        y: 0,
        z: 0,
        r: 0
    };
    #lastLocation = {
        x: 0,
        y: 0, 
        z: 0,
        r: 0
    };

    #animation = {
        index: 0,
        series: 0,
        frame: 0,
        startTime: Date.now()
    };
    #lastAnimation = {
        index: -1,
        series: -1,
        frame: -1
    };
    #opacity = 1;
    #ready = 1;
    #element = null;
    #lastIndex = -1;
    #framesPerSecond = 10;

    get opacity(){
        return this.#opacity
    }

    set opacity(value){
        if(this.#opacity!=value){
            this.#opacity = value;
            this.#forceRender = true;
        }
    }
    
    get animation(){
        return this.#animation;
    }

    get location(){
        return this.#location;
    }

    get element(){
        return this.#element;
    }
    
    get lastLocation(){
        return this.#lastLocation;
    }
    
    get id(){
        if(this.#element){
            return this.#element.id;
        }
        return null;
    }

    get size(){
        return this.#size;
    }

    get scaleX(){
        return this.#scaleX;
    }

    get scaleY(){
        return this.#scaleY;
    }
    
    set scale(value){
        this.#scaleX = value;
        this.#scaleY = value;
    }
    set scaleX(value){
        this.#scaleX = value;
    }
    set scaleY(value){
        this.#scaleY = value;
    }

    get framesPerSecond(){
        return this.#framesPerSecond;
    }
    set framesPerSecond(value){
        if(typeof(value)==='number'){
            this.#framesPerSecond = value;         
        }
    }

    constructor(screen, frameset, imageWidth, imageHeight, spriteWidth, spriteHeight, x, y, framesPerSecond){
        this.#screen = screen;
        this.#image.frameset = frameset;
        this.#image.width = imageWidth;
        this.#image.height = imageHeight;
        this.#size.width = spriteWidth;
        this.#size.height = spriteHeight;
        this.#location.x = x;
        this.#location.y = y;
        this.#lastLocation.x = x;
        this.#lastLocation.y = y;
        this.#framesPerSecond = framesPerSecond && typeof(framesPerSecond) === 'number' ? framesPerSecond : 10;
        this.#forceRender = false;
    }

    clone(){
        return new VC.Sprite(
            this.#screen, 
            this.#image.frameset,
            this.#image.width,
            this.#image.height,
            this.#size.width,
            this.#size.height,
            this.#location.x,
            this.#location.y,
            this.#framesPerSecond
        );
    }

    setAnimation(index,series){

        if(!(index!==this.#animation.index&&series==this.#animation.series)){
            this.#animation.frame = 0;
        }

        if (index!==this.#animation.index||series!==this.#animation.series){
            
            this.#animation.index = index;
            this.#animation.series = series;
            this.#animation.startTime = Date.now();
        }
        if (this.#animation.startTime === 0){
            this.#animation.startTime = Date.now();
        }
    }
    setFrame (index, series, frame){
            this.#animation.index = index;
            this.#animation.series = series;
            this.#animation.frame = frame;
            this.#animation.startTime = 0;
    }
    render(deltaT){
        let forceRender = this.#forceRender;
        this.#animation.frame = this.#calculateCurrentFrame(deltaT);
        if(this.#animation.startTime===0)
        {
            forceRender = true
        }
        let trans0 = this.#buildTranslation(this.#lastLocation.x, this.#lastLocation.y, this.#lastLocation.r);
        let trans1 = this.#buildTranslation(this.#location.x, this.#location.y, this.#location.r);

        let rect = this.#buildClipRect(); 

        if(!this.#element){
            this.#element = this.#screen.image(this.#image.frameset[this.#animation.index], 0, 0, this.#image.width, this.#image.height).attr({opacity:0, "clip-rect": rect, transform:trans1});

            trans0 = trans1;
            this.#lastLocation.x = this.#location.x;
            this.#lastLocation.y = this.#location.y;
            this.#lastLocation.r = this.#location.r;
            this.#screen.onClear(()=>{this.#element = null});
            this.#ready = 1  
            this.#lastIndex = this.#animation.index;
            forceRender = true
        } 
        if(this.#lastIndex !== this.#animation.index){
            this.#element.attr("src",this.#image.frameset[this.#animation.index]);
            this.#lastIndex = this.#animation.index;
        }

        let frameChanged = (this.#lastAnimation.frame !== this.#animation.frame || this.#lastAnimation.index !== this.#animation.index || this.#lastAnimation.series !== this.#animation.series)
        let positionChanged = (this.#location.x!==this.#lastLocation.x || this.#location.y !== this.#lastLocation.y || this.#location.r !== this.#lastLocation.r);

        if ((frameChanged || positionChanged || forceRender) && this.#element && this.#ready===1){
            this.#ready = 0;
            this.#element.attr({opacity:this.#opacity}).animate({transform:trans0, "clip-rect": rect},0, 'linear',()=>{
                if (this.#element){
                    this.#element.animate({transform:trans1, "clip-rect": rect}, 0, 'linear',()=>{
                        this.#ready = 1
                    });
                }
            });
        }

        this.#lastAnimation.frame = this.#animation.frame;
        this.#lastAnimation.index = this.#animation.index;
        this.#lastAnimation.series = this.#animation.series;
        this.#lastLocation.x = this.#location.x;
        this.#lastLocation.y = this.#location.y;
        this.#lastLocation.r = this.#location.r;
        this.#element.toFront();
        this.#forceRender = false;
        return this.#element;
    }
    
    remove (){
        if (this.#element){
            this.#element.remove();
            this.#element = null;
        }
    }

    #buildTranslation (x, y, r){
        if(this.location.z<0){
            y -= this.location.z;
        }
        if(this.#scaleX!==1 || this.#scaleY!==1){
            x = x + VC.Math.inversePercentToRange(this.#scaleX, 0, this.#size.width/2);
            y = y + VC.Math.inversePercentToRange(this.#scaleY, 0, this.#size.height/2); 
        }
        let tx = Math.round(x * (1/this.#scaleX) - this.#animation.frame * this.#size.width);
        let ty = Math.round(y * (1/this.#scaleY) - this.#animation.series *  this.#size.height) ;
        let t = "t" + tx + "," + ty;
        var rs = "";
        var s = "";

        if(this.#scaleX!==1||this.#scaleY!==1){
            s= "s" + this.#scaleX + "," + this.#scaleY + ",0,0";
        }

        if(r != 0){
            let rx = Math.round(this.#animation.frame * this.#size.width + this.#size.width/2);
            let ry = Math.round(this.#animation.series *  this.#size.height + this.#size.height/2);

            rs = "r" + r + "," + rx + "," + ry;
        }
        return s + t + rs;
       
    }

    /*
    #buildTranslation (x, y, r){
        if(this.location.z<0){
            y -= this.location.z;
        }
        if(this.#scaleX!==1 || this.#scaleY!==1){
            x = x + VC.Math.inversePercentToRange(this.#scaleX, 0, this.#size.width/2);
            y = y + VC.Math.inversePercentToRange(this.#scaleY, 0, this.#size.height/2); 
        }
        let tx = Math.round(x * (1/this.#scaleX) - this.#animation.frame * this.#size.width);
        let ty = Math.round(y * (1/this.#scaleY) - this.#animation.series *  this.#size.height);
        let t = "t" + tx + "," + ty;
        let r = "";
        if(r != 0){
            let rx = Math.round(this.#animation.frame * this.#size.width + this.#size.width/2);
            let ry = Math.round(this.#animation.series *  this.#size.height + this.#size.height/2);
            r = "r" + r + "," + rx + "," + ry;
        }
        let s = "";
        if(this.#scaleX !== 1 || this.#scaleY !== 1){
            s = "s" + this.#scaleX +"," + this.#scaleY + ",0,0";
        }
        return r + s + t;
    }
        */

    #buildClipRect(){
        let x = Math.round(this.#animation.frame * this.#size.width)+1
        let y = Math.round(this.#animation.series * this.#size.height)+1
        let w = this.#size.width-2;
        let h = this.#size.height-2;
        if(this.location.z<0){
            h=h+this.location.z;
        }
        return "" + x + "," + y +"," + w + "," + h;
    }



    #calculateCurrentFrame(deltaT) {
        if (this.#animation.startTime === 0){
            return this.#animation.frame;
        }
        let animdelta = Date.now() - this.#animation.startTime;
        let frame = Math.round((animdelta / 1000) * this.framesPerSecond) % Math.round(this.#image.width/this.#size.width);
        return frame;
    }
}
VC.Triangle = class {
    #registered = false;
    #p1 = new VC.Point(0,0);
    #p2 = new VC.Point(0,0);
    #p3 = new VC.Point(0,0);
    #elements = []
    constructor(p1, p2, p3){
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    get p1() {
        return this.#p1;
    }
    set p1(value){
        if(!(value instanceof VC.Point)){
            throw ("VC.Point expected!")
        }
        this.#p1 = value;
    }
    
    get p2() {
        return this.#p2;
    }
    set p2(value){
        if(!(value instanceof VC.Point)){
            throw ("VC.Point expected!")
        }
        this.#p2 = value;
    }
    
    get p3() {
        return this.#p3;
    }
    set p3(value){
        if(!(value instanceof VC.Point)){
            throw ("VC.Point expected!")
        }
        this.#p3 = value;
    }

    get points() {
        return[this.p1, this.p2, this.p3];
    }

    render(screen){
        if(!this.#registered){
            screen.onClear(this.remove);
            this.#registered = true;
        }
        if(this.#elements.length>0){
            this.remove();
        }
        this.p1.render(screen);
        this.p2.render(screen);
        this.p3.render(screen);
        this.#elements.push(screen.drawLine(this.p1.x, this.p1.y, this.p2.x, this.p2.y, "#00F", 1));
        this.#elements.push(screen.drawLine(this.p2.x, this.p2.y, this.p3.x, this.p3.y ,"#00F", 1));
        this.#elements.push(screen.drawLine(this.p3.x, this.p3.y, this.p1.x, this.p1.y, "#00F", 1));
    }

    remove(){
        if(this.#elements.length>0){
            this.p1.remove();
            this.p2.remove();
            this.p3.remove();
            this.#elements.forEach((element)=>element.remove());
            this.#elements = [];
        }
    }

    contains(obj){
        if(obj instanceof VC.Point) {
            let d1 = this.#sign(obj, this.p1, this.p2);
            let d2 = this.#sign(obj, this.p2, this.p3);
            let d3 = this.#sign(obj, this.p3, this.p1);
        
            let has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
            let has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        
            return !(has_neg && has_pos);
        }
        if (obj instanceof VC.Box){
            return this.contains(new VC.Point(obj.x, obj.y)) && this.contains(new VC.Point(obj.x + obj.width, obj.y)) && this.contains(new VC.Point(obj.x + obj.width, obj.y + obj.height)) && this.contains(new VC.Point(obj.x, obj.y + obj.height))
        }
        
        if (obj instanceof VC.Triangle){
            return this.contains(obj.p1) && this.contains(obj.p2) && this.contains(obj.p3)
        }
        return false;
    }

    #sign (p1,p2,p3)
    {
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    }
}

VC.Game = class{
    #state = VC.GameState.PAUSED;

    onPreRender(deltaT){}
    onRender(deltaT){}
    onPostRender(deltaT){}
    onPlay(){}
    onPause(){}

    #looping = false;
    _loop(lastTime){
        if(!this.#looping) {
            this.#looping = true;
        }
        let startTime = Date.now();
        let deltaT = Math.round(startTime-lastTime);
        //if(deltaT>1000) deltaT === 1000;
        if(this.#state === VC.GameState.RUNNING){
            //this.#preRender(deltaT)
            this.onPreRender(deltaT);
            this.onRender(deltaT);
            this.onPostRender(deltaT);
        }
        //window.setTimeout(()=>{this._loop(startTime);},0);
        requestAnimationFrame(()=>{this._loop(startTime)})
            
    }
    get state(){
        return this.#state;
    }
    play(){
        this.#state = VC.GameState.RUNNING;
        this.onPlay();
        if(!this.#looping){
            this._loop(Date.now());
        }
    }

    pause(){
        this.#state = VC.GameState.PAUSED;
        this.onPause();
    }
}

 VC.Box = class{
    #x=0;
    #y=0;
    #width=0;
    #height=0;
    #points = [];
    #poly = null;
    constructor(x,y,w,h){
        this.#x = x;
        this.#y = y;
        this.#width = w;
        this.#height = h;
        this.#points = [];
        this.#poly = null;
    }

    reset(newX, newY, newW, newH){
        this.x = newX;
        this.y = newY;
        this.width = newW;
        this.height = newH;
        this.#points = [];
        this.poly = null;
    }

    clone(){
        return new VC.Box(this.#x, this.#y, this.#width, this.#height);
    }

    set x(value){
        if(value!=this.#x){
            this.#x = value;
            this.#points = [];
        }
    }
    get x(){
        return this.#x;
    }
    
    set y(value){
        if(value!=this.#y){
            this.#y = value;
            this.#points = [];
        }
    }
    get y(){
        return this.#y;
    }

    
    set width(value){
        if(value!=this.#width){
            this.#width = value;
            this.#points = [];
        }
    }
    get width(){
        return this.#width;
    }

    set height(value){
        if(value!=this.#height){
            this.#height = value;
            this.#points = [];
        }
    }
    get height(){
        return this.#height;
    }


    #setPoints(){
        this.#points = [new VC.Point(this.#x, this.#y), new VC.Point(this.#x + this.#width, this.#y), new VC.Point(this.#x + this.#width, this.#y + this.#height), new VC.Point(this.#x, this.#y + this.#height)];
        this.#poly = null;
    }
    get points() {
        if(this.#points.length===0){
            this.#setPoints();
        }
        return this.#points
    }
    get polygon(){
        if(!this.#points.length===0 || this.#poly==null){
            this.#poly = new VC.Polygon(this.points, true);
        }
        return this.#poly;
    }
    
    center(x,y) {
        if(arguments.length === 1 && x!=null){
            this.x = x.x - this.width / 2
            this.y = x.y - this.height / 2
            this.#points = [];
        }
        if(arguments.length === 2 && x!=null && y!=null){
            this.x = x - this.width / 2
            this.y = y - this.height / 2
            this.#points = [];
        }
        return new VC.Point(
            this.x + Math.round(this.width/2),
            this.y + Math.round(this.height/2)
        );
    }
    
    area(){
        return this.width * this.height;
    }

    inside(box){
        if(
            box && 
            this.x > box.x && this.x < box.x + box.width &&
            this.x + this.width > box.x && this.x + this.width < box.x + box.width &&
            this.y > box.y && this.y < box.y + box.height &&
            this.y + this.height > box.y && this.y + this.height < box.y + box.height
        ){
            return true;
        }
        return false;
    }

    containsPoint(point){
        if (point instanceof VC.Point){
            return(this.x<point.x && this.x+this.width>point.x && this.y<point.y && this.y+this.height>point.y)
        }
        return false;
    }

    collidesWith(box){

            // Check for overlap along the X axis
            if (this.x + this.width < box.x || this.x > box.x + box.width) {
                return false;
            }

            // Check for overlap along the Y axis
            if (this.y + this.height < box.y || this.y > box.y + box.height) {
                return false;
            }

            // If there is overlap along all axes, collision has occurred
            return true;
    }
    resolveCollision_centers(box, variant){

        //we don't move. YOU move.
        if(this.collidesWith(box)){
            var tc = this.center();
            var bc = box.center();
            if(Math.abs(tc.x-bc.x)>Math.abs(tc.y-bc.y)){
                if(tc.x>bc.x){
                    box.x = this.x - box.width;
                }else{
                    box.x = this.x + this.width;
                }
            }else {
                if(tc.y>bc.y){
                    box.y = this.y - box.height;
                }else{
                    box.y = this.y + this.height;
                }
            }
        }

    }

    resolveCollision(box){

        var overlapX = Math.min(this.x + this.width, box.x + box.width) - Math.max(this.x, box.x);
        var overlapY = Math.min(this.y + this.height, box.y + box.height) - Math.max(this.y, box.y);
    
        if (overlapX > 0 && overlapY > 0) {
            let mtvX = 0;
            let mtvY = 0;
    
            if (overlapX < overlapY) {
                mtvX = this.center().x < box.center().x ? 1 : -1;
            } else {
                mtvY = this.center().y < box.center().y ? 1 : -1;
            }
            box.x += mtvX * overlapX;
            box.y += mtvY * overlapY;
        }
    }



    intersectRect(box) {
        let left = Math.max(this.x, box.x);
        let top = Math.max(this.y, box.y);
        let right = Math.min(this.x + this.width, box.x + box.width);
        let bottom = Math.min(this.y + this.height, box.y + box.height);
        
        // Check if there's an actual intersection
        if (left < right && top < bottom) {
            return new VC.Box(left, top, right-left, bottom-top);
        } else {
            // No intersection
            return null;
        }
    }

    pointOfIntersection(lineSegment){
        if(this.containsPoint(lineSegment.point1) && this.containsPoint(lineSegment.point2)){
            //return...? What should we expect?
            return null; 
        }
        //check each wall. 
        //North
        let w = new VC.LineSegment(new VC.Point(this.x, this.y), new VC.Point(this.x+this.width, this.y))
        let p = w.pointOfIntersection(lineSegment);
        if(p){
            return p;
        }

        //East
        w = new VC.LineSegment(new VC.Point(this.x+this.width, this.y), new VC.Point(this.x+this.width, this.y+this.height))
        p = w.pointOfIntersection(lineSegment);
        if(p){
            return p;
        }

        //South
        w = new VC.LineSegment(new VC.Point(this.x, this.y+this.height), new VC.Point(this.x+this.width, this.y+this.height))
        p = w.pointOfIntersection(lineSegment);
        if(p){
            return p;
        }

        //West
        w = new VC.LineSegment(new VC.Point(this.x, this.y), new VC.Point(this.x, this.y+this.height))
        p = w.pointOfIntersection(lineSegment);
        if(p){
            return p;
        }

        return null;

    }
    
    distance(box){
        let c1 = this.center();
        let c2 = box.center();
        let dx = c2.x - c1.x;
        let dy = c2.y - c1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    render(screen, color){
        if(!this.element){ 
            this.element = screen.rect(this.x, this.y, this.width, this.height).attr("stroke", color);
            screen.onClear(()=>{this.element = null});
        };
        this.element.attr({x:this.x, y:this.y, width: this.width, height: this.height});
        this.element.toFront();
    }
    remove(){
        if(this.element){
            this.element.remove();
            this.element = null;
        }   
    }
}

VC.Orientation = class {
    static get UNSET(){
        return -1;
    }
    static get LANDSCAPE(){
        return 0;
    }
    static get PORTRAIT(){
        return 1;
    }
}

VC.Client = class {
    static get screenHeight(){
        return window.screen.height;
    }
    static get screenWidth(){
        return window.screen.width;
    }
    static _orientation = VC.Orientation.UNSET;
    static get orientation(){
        return VC.Client._orientation;
    }
    static _orientationChangeListeners=[];
    static OnOrientationChange(func){
        VC.Client._orientationChangeListeners.push(func);
    }
    static _lastOrientation = VC.Orientation.UNSET;
    static _onOrientationChange(e){
        if((e && e.matches)||VC.Client.screenWidth>=VC.Client.screenHeight) {
            VC.Client._orientation = VC.Orientation.LANDSCAPE;
        } else {
            VC.Client._orientation = VC.Orientation.PORTRAIT;
        }
    
        if (VC.Client.orientation!==VC.Client._lastOrientation || VC.Client._lastOrientation === VC.Orientation.UNSET){
            VC.Client._lastOrientation = VC.Client.orientation;
            VC.Client._orientationChangeListeners.forEach((func)=>{func();})
        }
    }

    static _readyListeners=[];
    static _ready = false;
    static OnReady(func){
        if (VC.Client._ready){
            func();
            return;
        }
        VC.Client._readyListeners.push(func);
    }
    static Start(func){
        if (VC.Client._ready){
            return
        }
        VC.Client._ready = true;
        VC.Client._readyListeners.forEach((func)=>{func();})
    }
}

//Call once to set
VC.Client._onOrientationChange(window.matchMedia("(orientation: landscape)"));

//Bind for changes
window.matchMedia("(orientation: landscape)").addEventListener("change", VC.Client._onOrientationChange)
