"use strict" // debug with extreme prejudice

import DataMiner from "./Utils/DataMiner.js";
const dataMiner = new DataMiner();

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 1280,
    height: 800,
    scene: [Load, sceneName]
}

// globals
window.BASE = await dataMiner.run(`../../assets/base.tmj`, `base`)
window.GAME = new Phaser.Game(config);