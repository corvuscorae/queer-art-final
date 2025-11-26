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
                height: [0, this.base.length - 1],
                width: [0, this.base[0].length - 1]
            }
        };
    }

    create() {
        console.log("Scene loaded");
        const canvasDims = {
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
            const ePixel = [e.x, e.y]

            if(this.inRange(ePixel, canvasDims)) {
                this.makeNoise = false
                const eTile = this.pixelToTile(ePixel, this.tileset.tilesize)

                this.cursor = [eTile.x, eTile.y]

                const x = eTile[0]
                const y = eTile[1]

                this.stateArray[y][x] = this.tileAt(eTile, this.noiseArray);
                this.makeNoise = true
            }
        })

        // cursor
        const DIR = {
            d: [1, 0], a: [-1, 0], w: [0, 1], s: [0, -1]
        }
        this.input.keyboard.on('keydown', (e) => {
            // console.log(e)

            // movement
            if(e.key === "w") this.moveCell(this.cursor, DIR.w, this.base)
            if(e.key === "a") this.moveCell(this.cursor, DIR.a, this.base)
            if(e.key === "s") this.moveCell(this.cursor, DIR.s, this.base)
            if(e.key === "d") this.moveCell(this.cursor, DIR.d, this.base)
            console.log(this.cursor, this.tileAt(this.cursor, this.noiseArray))
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

        // draw cursor on top
        const rect = this.add.rectangle(
            this.cursor[0] * noiseTileset.tilesize,
            this.cursor[1] * noiseTileset.tilesize,
            noiseTileset.tilesize, noiseTileset.tilesize
        )
        rect.setOrigin(0)
        rect.setStrokeStyle(2, 0xffffff)
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
                
                if(!this.cursor && baseData[j][i] > 0) this.cursor = [i, j] // init cursor
                noise[j].push(tile)
            }
        }
        return noise
    }

    pixelToTile(pxPoint, tilesize){
        return [
            Math.floor(pxPoint[0] / tilesize),
            Math.floor(pxPoint[1] / tilesize),
        ]
    }

    tileAt(point, tilemap){
        return tilemap[point[1]][point[0]]        
    }

    inRange(point, dims){
        return (
            point[0] >= dims.x[0] && point[0] <= dims.x[1] && 
            point[1] >= dims.y[0] && point[1] <= dims.y[1]
        )
    }

    moveCell(cell, dir){
        cell[0] += dir[0]
        cell[1] += dir[1]
    }

    nextDrawnTile(pos, tilemap){
        // find next nonempty tile in tile map
        // left->right, up->down

    }

}
