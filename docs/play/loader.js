class System {
    #console = null;
    constructor(){
        this.#console = document.getElementById("os");
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
 
    async print(message){
        for(let i=0; i<message.length; i++){
            let s = message.substring(i,i+1);
            this.#console.innerHTML = this.#console.innerHTML.substring(0, this.#console.innerHTML.length - 1) + s + '|';
            await this.sleep(25)
        }
    }

    static async boot(scripts){
        var s = new System();
        await s.print("VolatileCoder OS v1.0 BETA")
        await s.print("\n\nLoading Display Subsystem...")
        await s.loadScript("raphael.min.js");
        await s.print("OK")
        await s.print("\n\nLoading Audio Subsystem...")
        await s.loadScript("howler.min.js");
        await s.print("OK")
        await s.print("\n\nLoading Gold & Ruin...")
        await s.loadScript("game.js");
        VC.Client.Start();
    }
}
 System.boot();