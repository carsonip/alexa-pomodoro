'use strict'
var BASE_URL = process.env.BASE_URL;
var audioData = {
  getUrl: function (name) {
    return BASE_URL + name + '.mp3';
  }
}
module.exports = audioData;
