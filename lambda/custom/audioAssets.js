'use strict'
var BASE_URL = process.env.BASE_URL;
var audioData = {
  getUrl: function (name, silent) {
    return BASE_URL + name + (silent?'-s':'') + '.mp3';
  }
}
module.exports = audioData;
