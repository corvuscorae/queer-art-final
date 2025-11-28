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
        // var colorPicker = new iro.ColorPicker('#picker');
        console.log("Scene loaded");
        this.canvasDims = {
            x: [0, window.GAME.config.width],
            y: [0, window.GAME.config.height]
        }

        const map = this.add.tilemap("map") 
        this.tilesheet = map.addTilesetImage(this.tileset.name, this.tileset.key);

        this.house = [];
        this.color = {
            r: 0, g: 255, b: 255
        };
        this.clickCount = 0
        this.clickPos = null

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

            if(this.inRange(ePixel, this.canvasDims)) {
                this.makeNoise = false
                const eTile = this.pixelToTile(ePixel, this.tileset.tilesize)

                // update cursor position
                if(this.base[eTile[1]][eTile[0]] > 0){ 
                    this.cursor.pos = [
                        eTile[0], 
                        eTile[1]
                    ]
                }
                
                // lock tile
                const x = eTile[0]
                const y = eTile[1]

                // this.stateArray[y][x] = this.tileAt(eTile, this.noiseArray);
                this.clickCount++
                if(this.tileAt(eTile, this.base) > 0) this.placeRectData(eTile, this.tileset)
                this.makeNoise = true

                this.clickPos = eTile
            } 
        })

        this.input.on('pointerup', () => { this.clickPos = null })

        this.input.on('pointermove', (e) => {
            if(this.clickPos){
                const x = this.clickPos[0] * this.tileset.tilesize
                const y = this.clickPos[1] * this.tileset.tilesize

                // change color
                this.changeColorAt([x, y], [e.position.x, e.position.y])
            }
        })

        // cursor
        const DIR = {
            d: [1, 0], a: [-1, 0], s: [0, 1], w: [0, -1]
        }
        this.input.keyboard.on('keydown', (e) => {
            // moving cursor
            if(e.key === "w") this.moveCell(this.cursor.pos, DIR.w, this.base)
            if(e.key === "a") this.moveCell(this.cursor.pos, DIR.a, this.base)
            if(e.key === "s") this.moveCell(this.cursor.pos, DIR.s, this.base)
            if(e.key === "d") this.moveCell(this.cursor.pos, DIR.d, this.base)

            // locking cell
            if(e.key === "Enter") {
                this.makeNoise = false

                const x = this.cursor.pos[0]
                const y = this.cursor.pos[1]

                // this.stateArray[y][x] = this.tileAt(this.cursor.pos, this.noiseArray);
                this.placeRectData(this.cursor.pos, this.tileset)
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

        // draw all rects on top
        for(const tile of this.house){
            if(tile.rect) tile.rect.destroy()
            
            tile.rect = this.add.rectangle(
                tile.x, tile.y, tile.w, tile.h
            )

            tile.rect.setOrigin(0)

            const col = Phaser.Display.Color.HSLToColor(tile.color.h, tile.color.s, tile.color.l)
            tile.rect.setFillStyle(col.color)
        }

        // draw cursor on top
        if(this.cursor.rect) this.cursor.rect.destroy()
        this.cursor.rect = this.add.rectangle(
            this.cursor.pos[0] * noiseTileset.tilesize,
            this.cursor.pos[1] * noiseTileset.tilesize,
            noiseTileset.tilesize, noiseTileset.tilesize
        )
        this.cursor.rect.setOrigin(0)
        this.cursor.rect.setStrokeStyle(2, 0xffffff)
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
                
                if(!this.cursor && baseData[j][i] > 0) this.cursor = { pos: [i, j] } // init cursor
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

    moveCell(cell, dx){
        let n = {
            x: cell[0] + dx[0],
            y: cell[1] + dx[1]
        }

        if(this.base[n.y][n.x] > 0){
            cell[0] = n.x
            cell[1] = n.y
        }
    }

    placeRectData(pos, tilesetInfor){
        const x = pos[0] * tilesetInfor.tilesize
        const y = pos[1] * tilesetInfor.tilesize

        const rect = {
            x: x,
            y: y,
            w: tilesetInfor.tilesize, 
            h: tilesetInfor.tilesize,
            color: { 
                h: this.map(x, this.canvasDims.x[0], this.canvasDims.x[1], 0, 1),
                s: 1,
                l: this.map(y, this.canvasDims.y[0], this.canvasDims.y[1], 0, 1),
            }
        }
        
        this.house.push(rect)
    }

    changeColorAt(pos, to){
        for(const rect of this.house){
            if(rect.x === pos[0] && rect.y === pos[1]){
                rect.color.h = this.map(to[0], this.canvasDims.x[0], this.canvasDims.x[1], 0, 1)
                rect.color.s = 1
                rect.color.l = this.map(to[1], this.canvasDims.y[0], this.canvasDims.y[1], 0, 1)
            }
        }
    }

    map(val, origMin, origMax, newMin, newMax){
        return newMin + (val - origMin) * ((newMax - newMin)/(origMax - origMin))
    }

}
