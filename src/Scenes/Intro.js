export default class Intro extends Phaser.Scene {
  constructor() {
    super("introScene");
  }

  init(data) {
    this.messages = data.messages;
    this.data = data
    this.data.keys = {}
  }

  create() {
    // keys
    this.Enter_key = this.input.keyboard.addKey("Enter");

    this.dialogClick = true;
    this.showNextMessage(this.messages.intro);
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

  update(){
    if (this.Enter_key.isDown) {
      if (this.dialog.on && this.dialogClick){
        document.getElementById("confirmBtn").click();
      }
      this.dialogClick = false;
    }
    if (this.Enter_key.isUp) {
      this.dialogClick = true;
    }

    if(this.messages.intro == 0 && this.dialog.on == false){
        this.Enter_key.isDown == false
        this.Enter_key.isUp == false

        this.scene.start("sceneKey", this.data); // start next scene
    }
  }
}
