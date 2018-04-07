'use strict';

var Alexa = require('alexa-sdk');
var audioData = require('./audioAssets');
var constants = require('./constants');

// Binding audio handlers to PLAY_MODE State since they are expected only in this mode.
var audioEventHandlers = Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    'PlaybackStarted' : function () {
        /*
         * AudioPlayer.PlaybackStarted Directive received.
         * Confirming that requested audio file began playing.
         * Storing details in dynamoDB using attributes.
         */
        this.attributes['token'] = getToken.call(this);
        console.log('token = ' + this.attributes['token']);
        // this.attributes['index'] = getIndex.call(this);
        this.attributes['playbackFinished'] = false;
        this.emit(':saveState', true);
    },
    'PlaybackFinished' : function () {
        /*
         * AudioPlayer.PlaybackFinished Directive received.
         * Confirming that audio file completed playing.
         * Storing details in dynamoDB using attributes.
         */
        console.log('playback finished')
        this.attributes['playbackFinished'] = true;
        this.attributes['enqueuedToken'] = false;
        this.emit(':saveState', true);
    },
    'PlaybackStopped' : function () {
        /*
         * AudioPlayer.PlaybackStopped Directive received.
         * Confirming that audio file stopped playing.
         * Storing details in dynamoDB using attributes.
         */
        this.attributes['token'] = getToken.call(this);
        // this.attributes['index'] = getIndex.call(this);
        this.attributes['offsetInMilliseconds'] = getOffsetInMilliseconds.call(this);
        console.log('stopped, offset: ' + this.attributes['offsetInMilliseconds']);
        this.emit(':saveState', true);
    },
    'PlaybackNearlyFinished' : function () {

        // console.log("ringing = " + this.attributes['ringing'] + " pomodoro = " + this.attributes['pomodoro']);
        this.attributes['ringing'] = true;

        /*
         * AudioPlayer.PlaybackNearlyFinished Directive received.
         * Using this opportunity to enqueue the next audio
         * Storing details in dynamoDB using attributes.
         * Enqueuing the next audio file.
         */
        if (this.attributes['enqueuedToken']) {
            /*
             * Since AudioPlayer.PlaybackNearlyFinished Directive are prone to be delivered multiple times during the
             * same audio being played.
             * If an audio file is already enqueued, exit without enqueuing again.
             */
            console.log('enqueued already!');
            return this.context.succeed(true);
        }
        
        // ringing
        if (this.attributes['ringing']) {
            var enqueueToken = 'ring'; 
            this.attributes['enqueuedToken'] = enqueueToken;
        
            var playBehavior = 'ENQUEUE';
            var url = audioData.getUrl('ring');
            var expectedPreviousToken = this.attributes['token'];
            var offsetInMilliseconds = 0;
            
            this.response.audioPlayerPlay(playBehavior, url, enqueueToken, expectedPreviousToken, offsetInMilliseconds);
            return this.emit(':responseReady');
        }
    },
    'PlaybackFailed' : function () {
        //  AudioPlayer.PlaybackNearlyFinished Directive received. Logging the error.
        console.log("Playback Failed : %j", this.event.request.error);
        this.context.succeed(true);
    }
});

module.exports = audioEventHandlers;

function getToken() {
    // Extracting token received in the request.
    return this.event.request.token;
}

function getIndex() {
    // Extracting index from the token received in the request.
    var tokenValue = parseInt(this.event.request.token);
    return this.attributes['playOrder'].indexOf(tokenValue);
}

function getOffsetInMilliseconds() {
    // Extracting offsetInMilliseconds received in the request.
    return this.event.request.offsetInMilliseconds;
}