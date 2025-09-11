'use strict';
const VC={};

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

    #isPointInsidePolygon(point, points) {
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
    /*
    #isPointInsidePolygon(point, points) {
        if (point == null) return false 
        let { x, y } = point;

        // First check: is the point exactly on a polygon edge?
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            let xi = points[i].x, yi = points[i].y;
            let xj = points[j].x, yj = points[j].y;

            // Check if point is on line segment (xi, yi) -> (xj, yj)
            let cross = (x - xi) * (yj - yi) - (y - yi) * (xj - xi);
            if (Math.abs(cross) < 1e-10) { // Collinear
                let dot = (x - xi) * (xj - xi) + (y - yi) * (yj - yi);
                if (dot >= 0) {
                    let sqLen = (xj - xi) * (xj - xi) + (yj - yi) * (yj - yi);
                    if (dot <= sqLen) {
                        return true; // On the edge
                    }
                }
            }
        }

        // Standard ray-casting check
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
    */

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
        return all(shape.points, point => this.#isPointInsidePolygon(point, this.points));
    }

    contains(shape) {
        return shape.points.some(point => this.#isPointInsidePolygon(point, this.points)) ||
               this.points.some(point => this.#isPointInsidePolygon(point, shape.points));
    }
    containsPoint(point){
        return this.#isPointInsidePolygon(point, this.points);
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

        let point1Inside = this.#isPointInsidePolygon(lineSegment.point1, this.points);
        let point2Inside = this.#isPointInsidePolygon(lineSegment.point2, this.points);

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
    }
    
    remove(){
        if(this.#element){
            this.#element.remove();
            this.#element = null;
        }   
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
VC.GameState = class {
    static get PAUSED(){
        return 0;
    }
    static get RUNNING(){
        return 1;
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
        window.setTimeout(()=>{this._loop(startTime);},0);
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
        return this.#screen.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
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
        let failed=[];
        this.#clearListeners.forEach((f)=>{
            try{
                f();
            } catch(e){
                failed.push(f);
            }
        });
        failed.forEach((f)=>this.#clearListeners.splice(this.#clearListeners.indexOf(f),1));
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
        r: 0
    };
    #lastLocation = {
        x: 0,
        y: 0, 
        r: 0
    };
    #scale = 1;
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
    
    get lastLocation(){
        return this.#lastLocation;
    }

    get size(){
        return this.#size;
    }

    get scale(){
        return this.#scale;
    }
    
    set scale(value){
        this.#scale = value;
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

    setAnimation(index,series){
        if (index!==this.#animation.index||series!==this.#animation.series){
            this.#animation.index = index;
            this.#animation.series = series;
            this.#animation.frame = 0;
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
                    this.#element.animate({transform:trans1, "clip-rect": rect}, deltaT, 'linear',()=>{
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
        if(this.#scale!==1){
            x = x + VC.Math.inversePercentToRange(this.#scale, 0, this.#size.width/2) 
            y = y + VC.Math.inversePercentToRange(this.#scale, 0, this.#size.height/2) 
        }
        let tx = Math.round(x * (1/this.#scale) - this.#animation.frame * this.#size.width);
        let ty = Math.round(y * (1/this.#scale) - this.#animation.series *  this.#size.height);
        let t = "t" + tx + "," + ty 
        if(this.#scale!==1){
            t="s"+this.#scale +","+this.#scale+",0,0" + t;
        }
        if(r === 0){
            return t
        }
        let rx = Math.round(this.#animation.frame * this.#size.width + this.#size.width/2);
        let ry = Math.round(this.#animation.series *  this.#size.height + this.#size.height/2);
        return t + "r" + r + "," + rx + "," + ry;
    }
    #buildClipRect(){
        let x = Math.round(this.#animation.frame * this.#size.width)+1
        let y = Math.round(this.#animation.series * this.#size.height)+1
        let w = this.#size.width-2;
        let h = this.#size.height-2;
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

/*

function drawSprite(ctx, spriteSheet, frameX, frameY, frameW, frameH, x, y, heat) {
  // map heat (0–100) to glow intensity
  const blur = Math.min(30, heat / 3); // cap at 30px blur
  const color = `rgba(255, ${200 - heat}, 0, 1)`; // shifts orange→red as heat rises

  // set glow
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;

  // draw current frame
  ctx.drawImage(
    spriteSheet,
    frameX, frameY, frameW, frameH, // source rect
    x, y, frameW, frameH            // destination rect
  );

  // reset shadow (important, otherwise next draws will glow too)
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}
*/

VC.Point = class {
    #element = null;
    x = 0;
    y = 0;
    constructor (x,y){
        this.x = x;
        this.y = y;
    }
    render(screen){
        if (this.#element){
            this.remove();
        }
        this.#element = screen.drawRect(this.x-1,this.y-1, 3, 3, "#fff","#000",0);
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

 VC.Box = class{
    #x=0;
    #y=0;
    #width=0;
    #height=0;
    #points = [];
    constructor(x,y,w,h){
        this.#x = x;
        this.#y = y;
        this.#width = w;
        this.#height = h;
        this.#points = [];
    }

    reset(newX, newY, newW, newH){
        this.x = newX;
        this.y = newY;
        this.width = newW;
        this.height = newH;
        this.#points = [];
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
    }
    get points() {
        if(this.#points.length===0){
            this.#setPoints();
        }
        return this.#points
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
            this.x >= box.x && this.x <= box.x + box.width &&
            this.x + this.width >= box.x && this.x + this.width <= box.x + box.width &&
            this.y >= box.y && this.y <= box.y + box.height &&
            this.y + this.height >= box.y && this.y + this.height <= box.y + box.height
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
    resolveCollision(box, variant){

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
    intersectRect(box) {
        let left = Math.max(this.x, box.x);
        let top = Math.max(this.y, box.y);
        let right = Math.min(this.x + this.width, box.x + box.width);
        let bottom = Math.min(this.y + box.height, box.y + box.height);
        
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
