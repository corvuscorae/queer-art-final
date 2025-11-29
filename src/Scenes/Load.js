import DataMiner from "../Utils/DataMiner.js"

export default class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");                     
        this.load.image("grey-tiles", "greys_Packed.png");  
        this.load.tilemapTiledJSON("map", "base.json");     
    
        this.load.json('baseData', 'base.json'); 
        this.load.json('messages', 'messages.json'); 
    }

    create() {
        console.log("Load finished...");

        const baseData = new DataMiner({ 
            json: this.cache.json.get('baseData'),
            name: 'base'
        }).run();

        const messages = this.cache.json.get('messages')

        this.scene.start("sceneKey", { base: baseData, messages: messages }); // start next scene
    }
}