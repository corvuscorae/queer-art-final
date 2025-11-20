"use strict" // debug with extreme prejudice

import Load from "./Scenes/Load.js";
import MyScene from "./Scenes/Scene.js";

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 1280,
    height: 800,
    scene: [Load, MyScene]
}

// globals
window.GAME = new Phaser.Game(config);