'use strict';

var Alexa = require('alexa-sdk');
var audioData = require('./audioAssets');
var constants = require('./constants');

var operationNotSupported = function() {
    var message = 'Operation not supported. To know what you can do, say, ask tomato helper for help.';
    this.response.speak(message);
    this.emit(':responseReady');
}

var progress = function () {
    var message = 'You are in the Pomodoro number ' + (this.attributes['pomodoroCnt'] + 1) + '. Say, next, to stop a ringing alarm. ';
    this.response.speak(message);
    this.emit(':responseReady');
}

var newLaunch = function () {
    this.attributes['pomodoro'] = true;
    this.attributes['pomodoroCnt'] = 0;
    //  Change state to START_MODE
    this.handler.state = constants.states.START_MODE;

    var message = 'Welcome to the tomato helper. If this is your first time using this skill, say, help. \
                    Remember, when the alarm rings, say, next, to stop it. \
                    Now, say, start timer, to begin. Say, start silent timer, for a silent timer.';
    var reprompt = 'You can say, start, start silent timer, or, help.';

    this.response.speak(message).listen(reprompt);
    this.emit(':responseReady');
}

var commonHandler = {
    'StartPomodoro' : function () {
        this.attributes['silent'] = false;
        controller.play.call(this);
    },
    'StartSilentPomodoro' : function () {
        this.attributes['silent'] = true;
        controller.play.call(this);
    },
    'Continue' : function () {
        continueFromRinging.call(this);
    },
    'Progress' : function () {
        progress.call(this);
    },
    'AMAZON.HelpIntent' : function () {
        var message = 'Tomato helper is a skill to track pomodoro in order to boost productivity. Each pomodoro is 25 minutes long and each break is 5 minutes long. \
                        After 4 pomodoros, you have a 20 minute break. \
                        When the alarm rings, say, next. \
                        To check your progress during the timer, say, Alexa, ask tomato helper for progress. \
                        To begin using tomato helper, say, start timer, or, start silent timer. ';
        this.response.speak(message).listen('To begin using tomato helper, say, start timer, or, start silent timer. ');
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent' : function () {
        var message = 'Good bye.';
        this.response.speak(message);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function () {
        var message = 'Good bye.';
        this.response.speak(message);
        this.emit(':responseReady');
    },
    'SessionEndedRequest' : function () {
        // No session ended logic
    },
    'Unhandled' : function () {
        var message = 'Sorry, I could not understand. You can say, ask tomato helper for help.';
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
    }
}

var stateHandlers = {
    startModeIntentHandlers : Alexa.CreateStateHandler(constants.states.START_MODE, Object.assign({
        /*
         *  All Intent Handlers for state : START_MODE
         */
        'LaunchRequest' : function () {
            newLaunch.call(this);
        },
    }, commonHandler)),
    playModeIntentHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, Object.assign({
        /*
         *  All Intent Handlers for state : PLAY_MODE
         */
        'LaunchRequest' : function () {
            newLaunch.call(this);
        },
        'AMAZON.NextIntent' : function () {
            stopRinging.call(this); 
            playTick.call(this);
        },
        'AMAZON.PreviousIntent' : function () { operationNotSupported.call(this) },
        'AMAZON.PauseIntent' : function () { controller.stop.call(this) },
        'AMAZON.StopIntent' : function () { controller.stop.call(this) },
        'AMAZON.CancelIntent' : function () { controller.stop.call(this) },
        'AMAZON.ResumeIntent' : function () { operationNotSupported.call(this) },
        'AMAZON.LoopOnIntent' : function () { controller.loopOn.call(this) },
        'AMAZON.LoopOffIntent' : function () { controller.loopOff.call(this) },
        'AMAZON.ShuffleOnIntent' : function () { controller.shuffleOn.call(this) },
        'AMAZON.ShuffleOffIntent' : function () { controller.shuffleOff.call(this) },
        'AMAZON.StartOverIntent' : function () { controller.startOver.call(this) },
    }, commonHandler)),
    remoteControllerHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Requests are received using a Remote Control. Calling corresponding handlers for each of them.
         */
        'PlayCommandIssued' : function () { controller.play.call(this) },
        'PauseCommandIssued' : function () { controller.stop.call(this) },
        'NextCommandIssued' : function () {
            stopRinging.call(this); 
            playTick.call(this, true);
        },
        'PreviousCommandIssued' : function () { operationNotSupported.call(this) }
    }),
    resumeDecisionModeIntentHandlers : Alexa.CreateStateHandler(constants.states.RESUME_DECISION_MODE, Object.assign({
        /*
         *  All Intent Handlers for state : RESUME_DECISION_MODE
         */
        'LaunchRequest' : function () {
            var message = 'You are in the Pomodoro number ' + (this.attributes['pomodoroCnt'] + 1) + '. Say, next, to stop a ringing alarm. Would you like to resume?';
            var reprompt = 'You can say yes to resume or no to play from the beginning.';
            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.YesIntent' : function () { controller.play.call(this) },
        'AMAZON.NoIntent' : function () { controller.reset.call(this) },
    }, commonHandler))
};

module.exports = stateHandlers;

var controller = function () {
    return {
        play: function () {
            /*
             *  Using the function to begin playing audio when:
             *      Play Audio intent invoked.
             *      Resuming audio when stopped/paused.
             *      Next/Previous commands issued.
             */
            this.handler.state = constants.states.PLAY_MODE;
            playTick.call(this);
        },
        stop: function () {
            /*
             *  Issuing AudioPlayer.Stop directive to stop the audio.
             *  Attributes already stored when AudioPlayer.Stopped request received.
             */
            this.response.audioPlayerStop();
            this.emit(':responseReady');
        },
        playNext: operationNotSupported.bind(this),
        playPrevious: operationNotSupported.bind(this),
        loopOn: operationNotSupported.bind(this),
        loopOff: operationNotSupported.bind(this),
        shuffleOn: operationNotSupported.bind(this),
        shuffleOff: operationNotSupported.bind(this),
        startOver: function () {
            // Start over the current audio file.
            this.attributes['offsetInMilliseconds'] = 0;
            controller.play.call(this);
        },
        reset: function () {
            // Reset to top of the playlist.
            this.attributes['index'] = 0;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;
            controller.play.call(this);
        }
    }
}();

function canThrowCard() {
    /*
     * To determine when can a card should be inserted in the response.
     * In response to a PlaybackController Request (remote control events) we cannot issue a card,
     * Thus adding restriction of request type being "IntentRequest".
     */
    if (this.event.request.type === 'IntentRequest' && this.attributes['playbackIndexChanged']) {
        this.attributes['playbackIndexChanged'] = false;
        return true;
    } else {
        return false;
    }
}

function stopRinging() {
    this.attributes['pomodoro'] = !this.attributes['pomodoro'];
    if (this.attributes['pomodoro']) this.attributes['pomodoroCnt']++;
    this.attributes['ringing'] = false;
}

function playTick(noSpeech) {
    var token;
    var url;

    if (this.attributes['pomodoro']) {
        // in pomodoro
        if (!noSpeech) this.response.speak('Pomodoro number ' + (this.attributes['pomodoroCnt'] + 1) + '. 25 minutes.');
        url = audioData.getUrl('tick25m', this.attributes['silent']);
        token = 'pomodoro';
    } else {
        // break
        if ((this.attributes['pomodoroCnt'] + 1) % 4 === 0) {
            // finished a set of 4
            if (!noSpeech) this.response.speak('Great! You\'ve finished a set of 4 pomodoros. Let\'s break for 20 minutes.');            
            url = audioData.getUrl('tick20m', this.attributes['silent']);
        } else {
            if (!noSpeech) this.response.speak('Let\'s break for 5 minutes.');
            url = audioData.getUrl('tick5m', this.attributes['silent']);
        }
        token = 'break';
    }
    this.attributes['enqueuedToken'] = null;
    
    var playBehavior = 'REPLACE_ALL';
    var offsetInMilliseconds = 0;
    
    this.response.audioPlayerPlay(playBehavior, url, token, null, offsetInMilliseconds);
    this.emit(':responseReady');
}