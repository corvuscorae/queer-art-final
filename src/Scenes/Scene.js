export default class MyScene extends Phaser.Scene {
  constructor() {
    super("sceneKey");
  }

  init(data) {
    this.base = data.base[0];
    this.messages = data.messages;

    this.tileset = {
      name: "greys_Packed",
      key: "grey-tiles",
      tilesize: 16,
    };

    this.tilemapConfig = {
      tileset: this.tileset,
      dims: {
        height: [0, this.base.length - 1],
        width: [0, this.base[0].length - 1],
      },
    };

    this.STYLE = {
      OUTLINE: { stroke: 2, color: 0xffffff },
      ORIGIN: 0,
    };

    let tileCount = 0;
    for (let j = 0; j < this.base.length; j++) {
      for (let i = 0; i < this.base[0].length; i++) {
        if (this.base[j][i] > 0) tileCount++;
      }
    }

    this.clicks = {
      lastUnlock: 0,
      unlockThreshold: 6, // Math.floor(tileCount / this.messages.body.length) - 1,
      logged: 0,
    };
  }

  showNextMessage(messages) {
    if (messages.length > 0) {
      const m = messages.shift();
      this.confirm(
        m,
        (args) => {
          this.showNextMessage(args);
        },
        messages
      );
    }
  }

  create() {
    this.keys = {
      W_key: this.input.keyboard.addKey("W"),
      A_key: this.input.keyboard.addKey("A"),
      S_key: this.input.keyboard.addKey("S"),
      D_key: this.input.keyboard.addKey("D"),
      Enter_key: this.input.keyboard.addKey("Enter"),
    }

    this.makeNoise = true;

    // var colorPicker = new iro.ColorPicker('#picker');
    console.log("Scene loaded");
    this.canvasDims = {
      x: [0, window.GAME.config.width],
      y: [0, window.GAME.config.height],
    };

    const map = this.add.tilemap("map");
    this.tilesheet = map.addTilesetImage(this.tileset.name, this.tileset.key);

    this.house = [];
    this.clickPos = null;

    this.pallette = [
      [
        { h: 0.0, s: 1, l: 0.5 },
        { h: 0.3, s: 1, l: 0.5 },
        { h: 0.8, s: 1, l: 0.5 },
      ],
      [
        { h: 0.1, s: 1, l: 0.5 },
        { h: 0.6, s: 1, l: 0.5 },
        { h: 0.9, s: 1, l: 0.5 },
      ],
      [
        { h: 0.15, s: 1, l: 0.5 },
        { h: 0.75, s: 1, l: 0.5 },
        { h: 1.0, s: 1, l: 1.0 },
      ],
    ];
    this.palletteMap = Array.from({ length: this.base.length }, () =>
      Array(this.base[0].length).fill(-1)
    );
    this.palletteCursor = {
      startPos: [51, 37],
      pos: [51, 37],
      rect: this.drawRect([51, 37], { outline: this.STYLE.OUTLINE }),
      color: this.pallette[0][0],
    };

    // init
    this.draw("noiseMap", "noiseLayer", "stateArray", this.base, this.tileset);

    // noise screen
    this.noise = this.time.addEvent({
      delay: 100, // ms
      callback: this.draw,
      args: ["noiseMap", "noiseLayer", "stateArray", this.base, this.tileset],
      callbackScope: this,
      loop: true,
      timeScale: 1,
    });

    // clicks
    const canvas = document.getElementById("phaser-game");
    this.input.on("pointerdown", (e) => {
      const ePixel = [e.x, e.y];

      if (this.inRange(ePixel, this.canvasDims)) {
        const eTile = this.pixelToTile(ePixel, this.tileset.tilesize);

        // update main cursor position
        if (this.base[eTile[1]][eTile[0]] > 0) {
          this.makeNoise = false;

          this.cursor.pos = [eTile[0], eTile[1]];

          // lock tile
          const x = eTile[0];
          const y = eTile[1];

          if (this.tileAt(eTile, this.base) > 0)
            this.placeRectData(eTile, this.tileset);
          this.makeNoise = true;
        } else if (this.palletteMap[eTile[1]][eTile[0]] !== -1) {
          this.palletteCursor.pos = [eTile[0], eTile[1]];
          this.clickPos = eTile;
        }
      }
    });

    this.input.on("pointerup", () => {
      this.clickPos = null;
    });

    this.input.on("pointermove", (e) => {
      if (this.clickPos) {
        const x = this.clickPos[0] * this.tileset.tilesize;
        const y = this.clickPos[1] * this.tileset.tilesize;

        // change color
        if (this.palletteMap[this.clickPos[1]][this.clickPos[0]] !== -1) {
          this.changeColorAt([x, y], [e.position.x, e.position.y]);
        }
      }
    });

    // cursor
    this.DIR = {
      d: [1, 0],
      a: [-1, 0],
      s: [0, 1],
      w: [0, -1],
    };
    this.moved = {
      at: -1,
      delay: 100,
    };

    this.makeNoise = false;
  }

  update() {
    if (this.keys.Enter_key.isDown) {
      if (this.dialog && this.dialog.on && this.dialogClick){
        document.getElementById("confirmBtn").click();
      }
      this.dialogClick = false;
    }
    if (this.keys.Enter_key.isUp) {
      this.dialogClick = true;
    }

    if (this.dialog && this.dialog.on) return;


    // moving cursor
    if (this.moveable() && this.keys.W_key.isDown) {
      this.moved.at = this.time.now;
      this.moveCell(this.cursor.pos, this.DIR.w, this.base);
    }
    if (this.moveable() && this.keys.A_key.isDown) {
      this.moved.at = this.time.now;
      this.moveCell(this.cursor.pos, this.DIR.a, this.base);
    }
    if (this.moveable() && this.keys.S_key.isDown) {
      this.moved.at = this.time.now;
      this.moveCell(this.cursor.pos, this.DIR.s, this.base);
    }
    if (this.moveable() && this.keys.D_key.isDown) {
      this.moved.at = this.time.now;
      this.moveCell(this.cursor.pos, this.DIR.d, this.base);
    }

    if (this.keys.Enter_key.isDown) {
      this.makeNoise = false;

      const x = this.cursor.pos[0];
      const y = this.cursor.pos[1];

      this.placeRectData(this.cursor.pos, this.tileset);
      this.makeNoise = true;
    }

    if (this.clicks.lastUnlock > this.clicks.unlockThreshold) {
      this.clicks.logged += this.clicks.lastUnlock;
      this.clicks.lastUnlock = 0;
      if (this.messages.body.length > 0) {
        this.showNextMessage([this.messages.body.shift()]);
      }
    }

    if (this.messages.body.length <= 0) {
      document.title = "HOME"

      this.add
        .text(window.GAME.config.width / 2, 100, "HOME", {
          fontSize: "128px",
          fill: "#ffffffff",
        })
        .setOrigin(0.5, 0.5);

      this.add
        .text(
          window.GAME.config.width / 2,
          window.GAME.config.height - 100,
          "by raven Ruiz",
          {
            fontSize: "18px",
            fill: "#ffffffff",
          }
        )
        .setOrigin(0.5, 0.5);
    }
  }

  moveable() {
    return this.time.now - this.moved.at > this.moved.delay;
  }

  draw(mapName, layerName, locked, shapeBase, noiseTileset) {
    if (this.dialog && this.dialog.on) return;
    if (!this.makeNoise) return;

    if (this[mapName]) this[mapName].destroy();
    if (this[layerName]) this[layerName].destroy();

    if (!this[locked]) {
      this[locked] = Array.from({ length: shapeBase.length }, () =>
        Array(shapeBase.length).fill(-1)
      );
    }

    // TODO: will need to only overwrite unset tiles (tiles not in stateMap)
    this.noiseArray = this.noiseField(
      shapeBase,
      this[locked],
      this.tilesheet.total
    );

    // create tilemap
    this[mapName] = this.make.tilemap({
      data: this.noiseArray,
      tileWidth: noiseTileset.tilesize, // width and height, in pixels, of individual tiles
      tileHeight: noiseTileset.tilesize,
    });

    // add tileset to map
    const tileset = this[mapName].addTilesetImage(
      noiseTileset.name,
      noiseTileset.key
    );

    // create layer from map
    this[layerName] = this[mapName].createLayer(0, tileset, 0, 0);

    // draw all rects on top
    for (const tile of this.house) {
      if (tile.rect) tile.rect.destroy();

      tile.rect = this.add.rectangle(tile.x, tile.y, tile.w, tile.h);

      tile.rect.setOrigin(0);

      const col = Phaser.Display.Color.HSLToColor(
        tile.color.h,
        tile.color.s,
        tile.color.l
      );
      tile.rect.setFillStyle(col.color);
    }

    // draw cursor on top
    if (this.cursor.rect) this.cursor.rect.destroy();
    this.cursor.rect = this.add.rectangle(
      this.cursor.pos[0] * noiseTileset.tilesize,
      this.cursor.pos[1] * noiseTileset.tilesize,
      noiseTileset.tilesize,
      noiseTileset.tilesize
    );
    this.cursor.rect.setOrigin(0);
    this.cursor.rect.setStrokeStyle(2, 0xffffff);

    // pallette
    this.drawPallette(51, 37);
  }

  drawRect(pos, style) {
    const w = this.tileset.tilesize;

    const rect = this.add.rectangle(pos[0] * w, pos[1] * w, w, w);
    rect.setOrigin(this.STYLE.ORIGIN);

    if (style.outline)
      rect.setStrokeStyle(style.outline.stroke, style.outline.color);
    if (style.fill) {
      const col = Phaser.Display.Color.HSLToColor(
        style.fill.h,
        style.fill.s,
        style.fill.l
      );
      rect.setFillStyle(col.color);
    }

    return rect;
  }

  noiseField(baseData, lockedTiles, tiles) {
    let noise = [];
    for (let j = 0; j < baseData.length; j++) {
      noise.push([]);
      for (let i = 0; i < baseData[j].length; i++) {
        // if tile in baseData is not empty, put a random tileID. otherwise keep it empty

        let tile = -1;
        if (lockedTiles[j][i] > -1) tile = lockedTiles[j][i];
        if (tile < 0 && baseData[j][i] > 0)
          tile = Phaser.Math.Between(0, tiles - 1);

        if (!this.cursor && baseData[j][i] > 0) this.cursor = { pos: [i, j] }; // init cursor
        noise[j].push(tile);
      }
    }
    return noise;
  }

  pixelToTile(pxPoint, tilesize) {
    return [
      Math.floor(pxPoint[0] / tilesize),
      Math.floor(pxPoint[1] / tilesize),
    ];
  }

  tileAt(point, tilemap) {
    return tilemap[point[1]][point[0]];
  }

  inRange(point, dims) {
    return (
      point[0] >= dims.x[0] &&
      point[0] <= dims.x[1] &&
      point[1] >= dims.y[0] &&
      point[1] <= dims.y[1]
    );
  }

  moveCell(cell, dx) {
    let n = {
      x: cell[0] + dx[0],
      y: cell[1] + dx[1],
    };

    if (this.base[n.y][n.x] > 0) {
      cell[0] = n.x;
      cell[1] = n.y;
    }
  }

  placeRectData(pos, tilesetInfor) {
    if (this.dialog && this.dialog.on === true) return;
    if (!this.houseTileFilled(pos)) this.clicks.lastUnlock++;

    const x = pos[0] * tilesetInfor.tilesize;
    const y = pos[1] * tilesetInfor.tilesize;

    const rect = {
      x: x,
      y: y,
      w: tilesetInfor.tilesize,
      h: tilesetInfor.tilesize,
      color: {
        h: this.palletteCursor.color.h,
        s: this.palletteCursor.color.s,
        l: this.palletteCursor.color.l,
      },
    };

    this.house.push(rect);
  }

  houseTileFilled(pos) {
    for (const tile of this.house) {
      if (
        tile.x === pos[0] * this.tileset.tilesize &&
        tile.y === pos[1] * this.tileset.tilesize
      )
        return true;
    }

    return false;
  }

  changeColorAt(pos, to) {
    const w = this.tileset.tilesize;
    const j = pos[1] / w;
    const i = pos[0] / w;

    const col = {};
    col.h = this.map(to[0], this.canvasDims.x[0], this.canvasDims.x[1], 0, 1);
    col.s = 1;
    col.l = this.map(to[1], this.canvasDims.y[0], this.canvasDims.y[1], 0, 1);

    const hsl = Phaser.Display.Color.HSLToColor(col.h, col.s, col.l);

    if (this.palletteMap[j][i]) this.palletteMap[j][i].destroy();
    this.palletteMap[j][i] = this.add.rectangle(i * w, j * w, w, w);

    this.palletteMap[j][i].setOrigin(0);
    this.palletteMap[j][i].setStrokeStyle(2, 0x000000);
    this.palletteMap[j][i].setFillStyle(hsl.color);

    this.pallette[j - this.palletteCursor.startPos[1]][
      i - this.palletteCursor.startPos[0]
    ] = col;
  }

  drawPallette(startX, startY) {
    const w = this.tileset.tilesize;

    for (let j = startY; j < startY + this.pallette.length; j++) {
      for (let i = startX; i < startX + this.pallette[0].length; i++) {
        if (this.palletteMap[j][i] !== -1) {
          this.palletteMap[j][i].destroy();
          this.palletteMap[j][i] = -1;
        }

        const col = this.pallette[j - startY][i - startX];
        const hsl = Phaser.Display.Color.HSLToColor(col.h, col.s, col.l);

        this.palletteMap[j][i] = this.add.rectangle(i * w, j * w, w, w);

        this.palletteMap[j][i].setOrigin(0);
        this.palletteMap[j][i].setStrokeStyle(2, 0x000000);
        this.palletteMap[j][i].setFillStyle(hsl.color);
      }
    }

    if (!this.clickPos) {
      if (this.palletteCursor.rect) this.palletteCursor.rect.destroy();
      this.palletteCursor.rect = this.drawRect(this.palletteCursor.pos, {
        outline: this.STYLE.OUTLINE,
      });
      this.palletteCursor.color =
        this.pallette[this.palletteCursor.pos[1] - startY][
          this.palletteCursor.pos[0] - startX
        ];
    }
  }

  map(val, origMin, origMax, newMin, newMax) {
    return newMin + (val - origMin) * ((newMax - newMin) / (origMax - origMin));
  }

  confirm(message, callback, args) {
    this.makeNoise = false;

    this.dialog = document.createElement("div");
    this.dialog.style.cssText = `
            position: fixed;
            top: ${window.GAME.config.height / 2 - 50}px;
            left: ${window.GAME.config.width / 2 - 100}px;
            max-width: 400px;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            z-index: 10000;
        `;

    document.body.appendChild(this.dialog);

    this.dialog.innerHTML = `
        <p style="margin-bottom: 20px;">${message.txt}</p>
        <button id="confirmBtn">${message.confirm}</button>
      `;

    this.dialog.style.display = "fixed";
    this.dialog.on = true;

    document.getElementById("confirmBtn").onclick = () => {
      document.body.removeChild(this.dialog);
      this.dialog.on = false;
      this.makeNoise = true;
      callback(args);
    };
  }
}
