'use strict';

var Alexa = require('alexa-sdk');
var constants = require('./constants');
var stateHandlers = require('./stateHandlers');
var audioEventHandlers = require('./audioEventHandlers');
var languageStrings = require('./language-strings.json');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.appId = constants.appId;
    alexa.resources = languageStrings;
    alexa.dynamoDBTableName = constants.dynamoDBTableName;
    alexa.registerHandlers(
        stateHandlers.startModeIntentHandlers,
        stateHandlers.playModeIntentHandlers,
        stateHandlers.remoteControllerHandlers,
        audioEventHandlers
    );

    var audioPlayerInterface = ((((event.context || {}).System || {}).device || {}).supportedInterfaces || {}).AudioPlayer;
    if (audioPlayerInterface === undefined) {
        alexa.emit(':tell', this.t('DEVICE_NOT_SUPPORTED'));
    }
    else {
        alexa.execute();
    }
};
