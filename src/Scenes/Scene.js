class sceneName extends Phaser.Scene {
    constructor() {
        super("sceneKey");
    }

    init() {
        this.tileset = {
            name: "greys_Packed", 
            key: "grey-tiles",    
            tileWidth: 16,
            tileHeight: 16
        };
    }

    create() {
        console.log(GAME, BASE)
        console.log("Scene loaded");

        const map = this.add.tilemap("map") 
        this.tilesheet = map.addTilesetImage(this.tileset.name, this.tileset.key);

        // NOISE 
        this.makeNoise = true
        const canvas = document.getElementById("phaser-game")
        canvas.onclick = (e) => {
            this.makeNoise = !this.makeNoise
        }

        // init
        this.makeNoiseMap("noiseMap", "noiseLayer", BASE[0], this.tileset)

        // noise screen
        this.noise = this.time.addEvent({
            delay: 100, // ms
            callback: this.makeNoiseMap,
            args: ["noiseMap", "noiseLayer", BASE[0], this.tileset],
            callbackScope: this,
            loop: true,
            timeScale: 1,
        });
    }

    update() {
    }

    makeNoiseMap(mapName, layerName, shapeBase, noiseTileset){
        if(!this.makeNoise) return;

        if(this[mapName]) this[mapName].destroy()
        if(this[layerName]) this[layerName].destroy()
            
        // create tilemap
        this[mapName] = this.make.tilemap({
            data: this.noiseField(shapeBase, this.tilesheet.total),
            tileWidth: noiseTileset.tileWidth,      // width and height, in pixels, of individual tiles
            tileHeight: noiseTileset.tileHeight,
        });

        // add tileset to map
        const tileset = this[mapName].addTilesetImage(noiseTileset.name, noiseTileset.key);

        // create layer from map
        this[layerName] = this[mapName].createLayer(0, tileset, 0, 0);
    }

    noiseField(baseData, tiles){
        let noise = []
        for(let j = 0; j < baseData.length; j++){
            noise.push([])
            for(let i = 0; i < baseData[j].length; i++){
                // if tile in baseData is not empty, put a random tileID. otherwise keep it empty
                const tile = (baseData[j][i] <= 0) ? -1 : Phaser.Math.Between(0, tiles - 1)
                noise[j].push(tile)
            }
        }
        return noise
    }

}
