export default class MyScene extends Phaser.Scene {
    constructor() {
        super("sceneKey");
    }

    init(data) {
        this.base = data.base[0]

        this.tileset = {
            name: "greys_Packed", 
            key: "grey-tiles",  
            tilesize: 16 
        }

        this.tilemapConfig = {
            tileset: this.tileset,
            dims: {
                height: this.base.length,
                width: this.base[0].length
            }
        };
    }

    create() {
        console.log("Scene loaded");
        const dims = {
            x: [0, window.GAME.config.width],
            y: [0, window.GAME.config.height]
        }

        const map = this.add.tilemap("map") 
        this.tilesheet = map.addTilesetImage(this.tileset.name, this.tileset.key);

        // NOISE 
        this.makeNoise = true
        
        // init
        this.makeNoiseMap("noiseMap", "noiseLayer", "stateArray", this.base, this.tileset)

        // noise screen
        this.noise = this.time.addEvent({
            delay: 100, // ms
            callback: this.makeNoiseMap,
            args: ["noiseMap", "noiseLayer", "stateArray", this.base, this.tileset],
            callbackScope: this,
            loop: true,
            timeScale: 1,
        });

        // clicks
        const canvas = document.getElementById("phaser-game")
        this.input.on('pointerdown', (e) => {
            const ePixel = {x: e.x, y: e.y}

            if(this.inRange(ePixel, dims)) {
                this.makeNoise = false
                const eTile = this.pixelToTile(ePixel, this.tileset.tilesize, this.tilemapConfig.dims)

                this.stateArray[eTile.y][eTile.x] = this.tileAt(eTile, this.noiseArray);
                this.makeNoise = true
            }
        })
    }

    update() {
    }

    makeNoiseMap(mapName, layerName, locked, shapeBase, noiseTileset){
        if(!this.makeNoise) return;

        if(this[mapName]) this[mapName].destroy()
        if(this[layerName]) this[layerName].destroy()

        if(!this[locked]){
            this[locked] = Array.from(
                { length: shapeBase.length }, () => Array(shapeBase.length).fill(-1)
            )
        }

        // TODO: will need to only overwrite unset tiles (tiles not in stateMap)
        this.noiseArray = this.noiseField(shapeBase, this[locked], this.tilesheet.total)
            
        // create tilemap
        this[mapName] = this.make.tilemap({
            data: this.noiseArray,
            tileWidth: noiseTileset.tilesize,      // width and height, in pixels, of individual tiles
            tileHeight: noiseTileset.tilesize,
        });

        // add tileset to map
        const tileset = this[mapName].addTilesetImage(noiseTileset.name, noiseTileset.key);

        // create layer from map
        this[layerName] = this[mapName].createLayer(0, tileset, 0, 0);
    }

    noiseField(baseData, lockedTiles, tiles){
        let noise = []
        for(let j = 0; j < baseData.length; j++){
            noise.push([])
            for(let i = 0; i < baseData[j].length; i++){
                // if tile in baseData is not empty, put a random tileID. otherwise keep it empty

                let tile = -1
                if(lockedTiles[j][i] > -1) 
                    tile = lockedTiles[j][i]
                if(tile < 0 && baseData[j][i] > 0) tile = Phaser.Math.Between(0, tiles - 1)
                
                noise[j].push(tile)
            }
        }
        return noise
    }

    pixelToTile(pxPoint, tilesize, mapDims){
        return {
            x: Math.floor(pxPoint.x / tilesize),
            y: Math.floor(pxPoint.y / tilesize),
        }
    }

    tileAt(point, tilemap){
        return tilemap[point.y][point.x]        
    }

    inRange(point, dims){
        return (
            point.x >= dims.x[0] && point.x <= dims.x[1] && 
            point.y >= dims.y[0] && point.y <= dims.y[1]
        )
    }

}
