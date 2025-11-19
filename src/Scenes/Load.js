class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");                     
        this.load.image("grey-tiles", "greys_Packed.png");  
        this.load.tilemapTiledJSON("map", "base.json");     
  
    }

    create() {
        console.log("Load finished...");
        this.scene.start("sceneKey"); // start next scene
    }
}