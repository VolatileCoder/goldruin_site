class System {
    static newClient = false;
    console = null;
    constructor(){
        
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    loadScript(url){
        return new Promise(function(resolve, reject) {

            var script = document.createElement('script');
            script.src = url;

            script.addEventListener('load', function() {
                resolve(script);
            }, false);

            script.addEventListener('error', function() {
                reject(script);
                console.log('was rej');
            }, false);

            document.body.appendChild(script);
        });
    }
    
    loadClickyScript(){
        //<script async data-id="101501165" src="//static.getclicky.com/js"></script>
        var script = document.createElement('script');
        script.src = "//static.getclicky.com/js";
        script.async = true;
        script.setAttribute("data-id", "101501165");
    }

    async fetchLastModified(callback) {
        let r = await fetch('loader.js', {method: "HEAD"});
        return new Date(r.headers.get('Last-Modified'));
    }
 
    async print(message){
        for(let i=0; i<message.length; i++){
            let s = message.substring(i,i+1);
            this.console.innerHTML = this.console.innerHTML.substring(0, this.console.innerHTML.length - 1) + s + '|';
            await this.sleep(25)
        }
    }

    spin(pos){
        if(pos == null){
            pos = 0;
        }
        if (this.console.style.visibility!='hidden'){
            let cursor = "|"
            switch (pos){
                case 1:
                    cursor = "/";
                    break;
                case 2:
                    cursor = "—";
                    break;
                case 3:
                    cursor = "\\";
                    break;
            }
            this.console.innerHTML = this.console.innerHTML.substring(0, this.console.innerHTML.length - 1) + cursor;
            pos++;
            var that = this;
            setTimeout(function(pos){that.spin(pos);},100,(pos%4));        
        }
    }

    setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        let expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    static async boot(){

        var s = new System();
        let lastModified = await s.fetchLastModified();
        let lastLoaded = s.getCookie("lm");
        System.newClient = (lastLoaded != lastModified.getTime().toString())
        let isLocal = document.URL.includes("localhost");
        if(!isLocal){
            s.loadClickyScript();
        }

        if(System.newClient && !isLocal){
            var os = document.createElement('div');
            os.id = "os";
            document.body.appendChild(os);
            s.console = os;
            await s.print("  .: VC Loader v1.1 BETA :.")
            await s.print("\n\nLoading Display Subsystem...")
            await s.loadScript("raphael.min.js");
            await s.loadScript("clipper.js");
            await s.print("OK")
            await s.print("\n\nLoading Audio Subsystem...")
            await s.loadScript("howler.min.js");
            await s.print("OK")
            await s.print("\n\nLoading VC Engine...")
            await s.loadScript("engine.js");
            await s.print("OK")
            await s.print("\n\nLoading Gold & Ruin...")
            s.spin();
            await s.loadScript("goldruin.js");
            os.style.visibility = 'hidden';
            os.style.display = 'none';
        }else{
            //await s.loadScript("colorpicker.iife.min.js")
            await s.loadScript("raphael.min.js");
            await s.loadScript("clipper.js");
            await s.loadScript("howler.min.js");
            await s.loadScript("engine.js");
            await s.loadScript("goldruin.js");
        }
        
        s.setCookie("lm", lastModified.getTime().toString(), 365);

        VC.Client.Start();
    }
}
 System.boot();