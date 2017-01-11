'use strict'
var audioData = [ { url: 'https://s3.amazonaws.com/alexa-pomodoro/tick1m.mp3' }]

var len = audioData.length
audioData.map(function (segment, index) {
  segment.title = 'Segment ' + (index + 1) + ' of ' + len
  return segment
})
module.exports = audioData
