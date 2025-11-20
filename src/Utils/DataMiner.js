// NOTE: uses logic from code written by Justin Lam for Sketchtiler
// https://github.com/blytheSchen/SketchTiler/blob/main/src/5_Utility/DataMiner.js

// Used to extract the tile ID matrices from a tilemap's layers.
const key = "base";

export default class DataMiner {
  constructor(data) {
    this.json = data.json
    this.name = data.name
  }

  run() {
    const result = [];
    let str = "[\n";

    str += `\t// ${this.name} \n`;

    for (const layer of this.json.layers) {
      const matrix = this.createMatrixFromArray(layer.width, layer.height, layer.data);
      result.push(matrix)

      str += this.matrixToStr(matrix, `\t// ${layer.name}`);
      str += '\n';
    }

    str += "];";

    // console.log(str);
    console.log(result)
    return result;
  }

  createMatrixFromArray(width, height, array) {
    const matrix = this.createMatrix(width, height);

    for (let i = 0; i < array.length; i++) {
      const y = Math.floor(i / width);
      const x = i % width;
      matrix[y][x] = array[i];
    }

    return matrix
  }

  createMatrix(width, height) {
    const matrix = [];

    for (let y = 0; y < height; y++) {
      matrix[y] = [];
      for (let x = 0; x < width; x++) {
        matrix[y][x] = undefined;
      }
    }

    return matrix;
  }

  matrixToStr(matrix, comment) {
    let str = `\t[${comment}\n`;
    
    for (const row of matrix) {
      str += "\t\t["
      for (const elem of row) str += `${elem},`;
      str += "],\n";
    }

    str += "\t],\n";

    return str;
  }
}