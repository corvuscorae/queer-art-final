// NOTE: uses code written by Justin Lam for Sketchtiler
// https://github.com/blytheSchen/SketchTiler/blob/main/src/5_Utility/DataMiner.js

// Used to extract the tile ID matrices from a tilemap's layers.
const key = "base";

export default class DataMiner {
  constructor() {  }

  async run(path, key) {
    // learning source: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON
    // also ChatGPT
    const result = [];
    let str = "[\n";

    const response = await fetch(path);
    if (!response.ok) throw new Error(`There was an error with fetching ${path}.`);

    let json;
    try {
      json = await response.json();
    } catch {
      throw new Error(`There is a problem with the contents of ${path}.`);
    }

    str += `\t// ${key} \n`;

    for (const layer of json.layers) {
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