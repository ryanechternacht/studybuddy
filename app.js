/**
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 http://aws.amazon.com/apache2.0/
 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */


'use strict';
var https = require('https');
// var rp = require('request-promise');
/**
 * When editing your questions pay attention to your punctuation. Make sure you use question marks or periods.
 * Make sure the first answer is the correct one. Set at least 4 answers, any extras will be shuffled in.
 */
var questions = [
    {
        question: "Which bird makes this sound? <audio src='https://s3.amazonaws.com/angelhackcinci/output.mp3'/>",
        answer: "eagle",
        hint: ["Starts with an h.","A sharpshooter"],
        more: "These birds are excellent birds of pray who eat everythings. They have sharp claws and sharper eyes.",
        subject:"birds"
    },
    {
        question: "What color do red and blue combine to make?",
        answer: "purple",
        hint: ["this is a hint","it rhymes with nurple"],
        more: "roses are red, violets are blue",
        subject: "art"
    }
];

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // handle yes/no intent after the user has been prompted
    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
        if ("AMAZON.NoIntent" === intentName) {
            handleFinishSessionRequest(intent, session, callback);
        } else if ("AMAZON.YesIntent" === intentName) {
            handleRepeatRequest(intent, session, callback);
        }
    }

    // dispatch custom intents to handlers here
    if("PickSubjectIntent" === intentName){
        handlePickSubjectRequest(intent,session, callback);
    }else if ("AnswerIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AnswerOnlyIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("DontKnowIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("HintIntent" === intentName) {
        handleHintRequest(intent, session, callback);
    } else if ("MoreDetailsIntent" === intentName){
        handleMoreDetailsRequest(intent, session, callback);
    } else if ("AMAZON.YesIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.NoIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

// ------- Skill specific business logic -------

var GAME_LENGTH = 2;
var CARD_TITLE = "Studylexa"; // Be sure to change this for your skill.

function getWelcomeResponse(callback) {
    try {
        var sessionAttributes = {},
            speechOutput = "Welcome to StudyLex... Pick a subject to start off.",

            // speechOutput = "Welcome to StudyLex. I will ask you " + GAME_LENGTH.toString()
            //     + " questions, try to get as many right as you can. Let's begin. ",

            shouldEndSession = false,
            gameQuestions = populateGameQuestions(questions),
            currentQuestion = gameQuestions[0],
            spokenQuestion = currentQuestion.question;

        // speechOutput += "Question 1. " + spokenQuestion;

        https.get("https://studylex.azurewebsites.net/blog/posts", function(res) {
            var body = '';

            res.on('data', function (chunk) {
                body += chunk;
                
                            // console.log(body);
            body = JSON.parse(body);
            // console.log(body);
            // console.log(gameQuestions);
            
            var l = body.length, hint;
            while(l--) {
                hint = [];
                hint.push(body[l].hint1);
                hint.push(body[l].hint2);
                hint.push(body[l].hint3);
                body[l].hint = hint;
                gameQuestions.push(body[l]);
            }
            console.log(gameQuestions);
            });


            res.on('end', function () {
                // var stringResult = JSON.parse(body);
                console.log(body);

                // var speechOutput = "the response was ";
                var speechOutput = "the response was " + gameQuestions[gameQuestions.length - 1].subject;

                sessionAttributes = {
                    "speechOutput": speechOutput,
                    "repromptText": speechOutput,
                    "currentQuestion": currentQuestion,
                    "askedQuestions": 0,
                    "questions": gameQuestions,
                    "score": 0,
                };
                callback(sessionAttributes,
                    buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
            });
        }).on('error', function (e) {
            console.log("Got error: ", e);
        });
    }
    catch(ex) {
        console.log(ex);
        throw ex;
    }
}

function populateGameQuestions(ques) {
    // var gameQuestions = [];
    // var indexList = [];
    // var index = questions.length;

    // if (GAME_LENGTH > index){
    //     throw "Invalid Game Length.";
    // }

    // for (var i = 0; i < questions.length; i++){
    //     indexList.push(i);
    // }

    // // Pick GAME_LENGTH random questions from the list to ask the user, make sure there are no repeats.
    // for (var j = 0; j < GAME_LENGTH; j++){
    //     var rand = Math.floor(Math.random() * index);
    //     index -= 1;

    //     var temp = indexList[index];
    //     indexList[index] = indexList[rand];
    //     indexList[rand] = temp;
    //     gameQuestions.push(indexList[index]);
    // }

    // return gameQuestions;

    return ques;
}

function handlePickSubjectRequest(intent, session, callback){

    var subject = "";

    var speechOutput = "";
    var gameLen = 0;

    if(intent && intent.slots && intent.slots.Subject && intent.slots.Subject.value){
        subject = intent.slots.Subject.value;

        speechOutput = subject.toString()+" selected as the Subject... Let's begin"

        var questionList = [];

        for(var i = 0; i < questions.length; i++) {
            var q = questions[i];
            if(q.subject == subject) {
                questionList.push(q);

                console.log("CheckRRR : " +q.toString())
            }

            gameLen = gameLen + 1;
        }
        GAME_LENGTH = gameLen;

    }else{
        speechOutput = "No subject selected. Mixing up questions"
    }
    try {
        var sessionAttributes = {},
            shouldEndSession = false,
            gameQuestions = populateGameQuestions(questionList),
            currentQuestion = gameQuestions[0],
            spokenQuestion = currentQuestion.question;

        speechOutput = speechOutput+"...."+"I will ask you " + GAME_LENGTH.toString()
            + " questions, try to get as many right as you can. Let's begin. "
        speechOutput += "Question 1. " + spokenQuestion;

        sessionAttributes = {
            "speechOutput": speechOutput,
            "repromptText": speechOutput,
            "currentQuestion": currentQuestion,
            "askedQuestions": 0,
            "questions": gameQuestions,
            "score": 0,
        };
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
    }
    catch(ex) {
        console.log(ex);
        throw ex;
    }


}


function handleHintRequest(intent, session, callback) {
    var speechOutput = "";
    var sessionAttributes = {};
    var hintCount = session.attributes.hintCount || 0;

    if (hintCount >= session.attributes.currentQuestion.hint.length){
        speechOutput = "There are no more hints";
    } else{
        speechOutput = session.attributes.currentQuestion.hint[hintCount];
    }

    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": speechOutput,
        "currentQuestion": session.attributes.currentQuestion,
        "questions": session.attributes.questions,
        "score": session.attributes.currentScore,
        "askedQuestions": session.attributes.askedQuestions,
        "hintCount":hintCount+1
    };

    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function handleMoreDetailsRequest(intent, session, callback){
    var speechOutput = "";
    var sessionAttributes = {};

    speechOutput = session.attributes.currentQuestion.more;

    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": speechOutput,
        "currentQuestion": session.attributes.currentQuestion,
        "questions": session.attributes.questions,
        "score": session.attributes.currentScore,
        "askedQuestions": session.attributes.askedQuestions
    };

    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function handleAnswerRequest(intent, session, callback) {
    try
    {
        var speechOutput = "",
            sessionAttributes = {};

        var gameInProgress = session.attributes && session.attributes.questions;
        var userGaveUp = intent.name === "DontKnowIntent";

        if (!gameInProgress) {
            // If the user responded with an answer but there is no game in progress, ask the user
            // if they want to start a new game. Set a flag to track that we've prompted the user.
            sessionAttributes.userPromptedToContinue = true;
            speechOutput = "There is no game in progress. Do you want to start a new game? ";
            callback(sessionAttributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
        } else {
            var gameQuestions = session.attributes.questions,
                currentScore = parseInt(session.attributes.score) || 0,
                currentQuestionText = session.attributes.currentQuestion.question,
                correctAnswerText = session.attributes.currentQuestion.answer,
                askedQuestions = session.attributes.askedQuestions;

            var speechOutputAnalysis = "";

            if (intent && intent.slots && intent.slots.Answer && intent.slots.Answer.value == correctAnswerText) {
                currentScore++;
                speechOutputAnalysis = "correct. ";
            } else {
                if (!userGaveUp) {
                    speechOutputAnalysis = "wrong. ";
                }
                // speechOutputAnalysis += "You answered " + intent +
                //     " while the correct answer is " + correctAnswerText + ". ";



                speechOutputAnalysis = "wrong. The correct answer is " + correctAnswerText + ". ";
                console.log(intent);
                console.log(correctAnswerText);
            }

            if (askedQuestions == GAME_LENGTH - 1) {

                var scoreCommentValue = Math.round(currentScore/GAME_LENGTH);
                var scoreChecker = 0.5
                var scoreComment = ""

                if (scoreCommentValue >= scoreChecker){
                    scoreComment = "Well done !";
                }else{
                    scoreComment = "Hm. better luck next time."
                }


                speechOutput = userGaveUp ? "" : "That answer is ";
                speechOutput += speechOutputAnalysis + "You got " + currentScore.toString() + " out of "
                    + GAME_LENGTH.toString() + " questions correct...." + scoreComment;
                callback(session.attributes,
                    buildSpeechletResponse(CARD_TITLE, speechOutput, "", true));
            } else {
                askedQuestions += 1;
                var question = gameQuestions[askedQuestions];
                var roundAnswer = question.answer,
                    questionIndexForSpeech = askedQuestions + 1,
                    repromptText = "Question " + questionIndexForSpeech.toString() + ". " + question.question + " ";

                speechOutput += userGaveUp ? "" : "That answer is ";
                speechOutput += speechOutputAnalysis + "Your score is " + currentScore.toString() + ". " + repromptText;

                sessionAttributes = {
                    "speechOutput": speechOutput,
                    "repromptText": repromptText,
                    "currentQuestion": question,
                    "questions": gameQuestions,
                    "score": currentScore,
                    "askedQuestions": askedQuestions
                };
                callback(sessionAttributes,
                    buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
            }
        }
    }
    catch(ex) {
        console.log(ex);
        throw ex;
    }
}

function handleRepeatRequest(intent, session, callback) {
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new game session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
    }
}

function handleGetHelpRequest(intent, session, callback) {
    // Provide a help prompt for the user, explaining how the game is played. Then, continue the game
    // if there is one in progress, or provide the option to start another one.

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    // Do not edit the help dialogue. This has been created by the Alexa team to demonstrate best practices.

    var speechOutput = "I will ask you " + GAME_LENGTH + " multiple choice questions. Respond with the number of the answer. "
            + "For example, say one, two, three, or four. To start a new game at any time, say, start game. "
            + "To repeat the last question, say, repeat. "
            + "Would you like to keep playing?",
        repromptText = "To give an answer to a question, respond with the number of the answer . "
            + "Would you like to keep playing?";
    var shouldEndSession = false;
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}

// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    console.log(output);

    return {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>" + output + "</speak>"
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: "<speak>" + output + "</speak>"
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>" + output + "</speak>"
        },
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: "<speak>" + output + "</speak>"
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}