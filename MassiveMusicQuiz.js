// ==UserScript==
// @name         MassiveMusicQuiz
// @namespace    https://github.com/nemolovich
// @version      0.3.1
// @description  Get preloaded musics.
// @author       Nemolovich
// @match        http://fr.massivemusicquiz.com/games
// @grant        none
// require      http://fr.massivemusicquiz.com/javascripts/jquery.js
// ==/UserScript==

// --------------------------------------------------------

// =========== CONFIG =================
var NB_TITLES = 0;                                // Number of passed titles.
var TITLES_ID = 'past_songs_body';                // Title table element ID.

var CONTAINER_ID = 'round_number';                // Container element ID to check for start track.
var CONTAINER_VALUE = -1;                         // Container value.

// =========== GLOBAL =================
var START_DELAY = 1500;                           // Deplay to start script (ms).
var PREFIX = 'http://fr.massivemusicquiz.com';    // URL prefix (host). 
var DEFAULT_CATEGORY = 77;                        // Default game category.
var CURR_CATEGORY;                                // Current category.
var LISTENER;                                     // Interval object to check for updates.
var PLAYING = false;                              // Define if player plays music.
var TIMER;                                        // Flash element timer.
var COUNTDOWN;                                    // Timer information for users.

// =========== USER ===================
var AUTO_UPDATE = true;                           // Start and stop track automatically.
var UPDATE_INTERVAL = 500;                        // Check for updates interval time (ms).
var DEBUG = 3;                                    // Debug level (0: ERROR, 1: WARNING, 2: INFO, 3: DEBUG).

// =========== CSS ====================
var CSS="audio {\n" + 
    "	background-color: rgba(0,0,0,0.1);\n" + 
    "	height: 20px;\n" + 
    "	width:  200px;\n" + 
    "	padding: 0;\n" + 
    "	margin: 0;\n" + 
    "	margin-top: -10px;\n" + 
    "}\n" + 
    "\n" + 
    "audio::-webkit-media-controls-panel {\n" + 
    "	padding: 0;\n" + 
    "	margin: 0;\n" + 
    "	margin-top:	10px;\n" + 
    "	height: 20px;\n" + 
    "	width:  200px;\n" + 
    "	background-color: rgba(0,0,0,0.2);\n" + 
    "	background-position: top;\n" + 
    "}\n" + 
    "\n" + 
    "audio::-webkit-media-controls-timeline-container,\n" + 
    "audio::-webkit-media-controls-volume-slider-container {\n" + 
    "	height: 2px;\n" + 
    "	width:  10px;\n" + 
    "}\n" + 
    "\n" + 
    "audio::-webkit-media-controls-current-time-display,\n" + 
    "audio::-webkit-media-controls-time-remaining-display {\n" + 
    "	font-size: 7pt;\n" + 
    "	height: 10px;\n" + 
    "	width:  10px;\n" + 
    "	padding: 0;\n" + 
    "	margin: 0;\n" + 
    "	margin-bottom: 20px;\n" + 
    "	margin-right: 10px;\n" + 
    "}\n" + 
    "\n" + 
    "audio::-webkit-media-controls-timeline,\n" + 
    "audio::-webkit-media-controls-volume-slider\n" + 
    "{\n" + 
    "	cursor: pointer;\n" + 
    "	height: 2px;\n" + 
    "	margin: 0 5px 0 0;\n" + 
    "	border-radius: 10px;\n" + 
    "}\n" + 
    "\n" + 
    "audio::-webkit-media-controls-timeline {\n" + 
    "	width:  80px;\n" + 
    "	max-width: 80px;\n" + 
    "}\n" + 
    "\n" + 
    "audio::-webkit-media-controls-volume-slider {\n" + 
    "	width:  60px;\n" + 
    "	max-width: 60px;\n" + 
    "}\n" + 
    "\n" + 
    "audio::-webkit-media-controls-mute-button,\n" + 
    "audio::-webkit-media-controls-play-button,\n" + 
    "audio::-webkit-media-controls-seek-back-button,\n" + 
    "audio::-webkit-media-controls-seek-forward-button,\n" + 
    "audio::-webkit-media-controls-fullscreen-button,\n" + 
    "audio::-webkit-media-controls-rewind-button,\n" + 
    "audio::-webkit-media-controls-return-to-realtime-button,\n" + 
    "audio::-webkit-media-controls-toggle-closed-captions-button {\n" + 
    "	height: 15px;\n" + 
    "	width:  15px;\n" + 
    "}";

// --------------------------------------------------------

function getNow() {
    var date = new Date();

    return (date.getHours() < 10 ? "0" : "") + date.getHours() + ":" +
        (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + ":" +
        (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
}

function debug(msg) {
    console.debug('[' + getNow() + '] DEBUG: ' + msg);
}

function info(msg) {
    console.log('[' + getNow() + '] INFO: ' + msg);
}

function warn(msg) {
    console.warn('[' + getNow() + '] WARNING: ' + msg);
}

function error(msg) {
    console.error('[' + getNow() + '] ERROR: ' + msg);
}

function playMusic() {
    var audioTag = document.getElementById('audioTag');
    audioTag.play();
    PLAYING = true;
    if (DEBUG > 2) {
        debug('Preload music started.');
    }
}

function stopMusic() {
    var audioTag = document.getElementById('audioTag');
    if (PLAYING) {
        audioTag.pause();
        PLAYING = false;
        if (DEBUG > 2) {
            debug('Preload music stopped.');
        }
    } else {
        audioTag.currentTime = 0;
        try {
            audioTag.load();
        } catch (e) {
            if (DEBUG > 2) {
                info('There is no track loaded.');
            }
        }
        if (DEBUG > 2) {
            debug('Preload music reset.');
        }
    }
}

function buildAudioTag(src) {
    var result = document.createElement('audio');
    result.id = 'audioTag';
    result.controls = true;
    result.style.marginBottom = "3px";
    result.style.verticalAlign = "bottom";

    if (src) {
        result.src = src;
    }

    return result;
}

function updateAudio(url) {
    var audioTag = document.getElementById('audioTag');
    var links = document.getElementById('top-bar').getElementsBySelector('div.links')[0];

    links.removeChild(audioTag);

    audioTag = buildAudioTag(url);

    links.insertBefore(audioTag, document.getElementById('autoCheck'));

    audioTag.load();
    playMusic();
}

function getURL(category_id, alternate) {
    var url = PREFIX + '/tmp/stats_cache_' + category_id + (alternate ? '_long' : '') + '.js?' + (new Date().getTime());
    new Ajax.Request(url, {method: 'get', onSuccess: function(transport){
        var json = eval('(' + transport.responseText + ')');
        var preloadURL = PREFIX + '/tmp/' + json.preload + '?' + (new Date().getTime());
        if (DEBUG > 2) {
            debug('Sound URL: ' + preloadURL);
        }
        updateAudio(preloadURL);
    }});
}

function init() {

    if (DEBUG > 2) {
        debug('Init the cheat block...');
    }

    var links = document.getElementById('top-bar').getElementsBySelector('div.links')[0];

    CURR_CATEGORY = window.infos.category_id;
    category = window.infos.category_name;
    if (DEBUG > 2 && category && CURR_CATEGORY) {
        debug('Current category is "' + category + '" [' + CURR_CATEGORY + '].');
    } else if(!category || !CURR_CATEGORY) {
        warn('Category could not be found. Using id ' + CURR_CATEGORY + '.');
    }

    if (!links) {
        error('Can not retreive banner div!');
        return;
    }
    var firstElement = links.children[0];
    if (!firstElement) {
        error('Can not retreive banner div content!');
        return;
    }

    var divTimer = document.createElement('div');
    divTimer.style.color = '#FFFFFF';
    timerSpan = document.createElement('span');
    timerSpan.innerHTML = 'Timer: ';
    COUNTDOWN = document.createElement('span');
    COUNTDOWN.id='countdown';
    COUNTDOWN.style.color='#FFFFFF';
    COUNTDOWN.style.fontWeight ='bold';
    COUNTDOWN.style.textAlign = 'right';
    COUNTDOWN.style.width = '20px';
    COUNTDOWN.style.display = 'inline-block';
    COUNTDOWN.innerHTML = '-1';

    divTimer.appendChild(timerSpan);
    divTimer.appendChild(COUNTDOWN);

    divTimer.style.display ='inline-block';
    divTimer.style.paddingTop = '4px';
    divTimer.style.paddingBottom = '4px';
    divTimer.style.paddingRight = '8px';
    divTimer.style.borderRight = '1px solid #6f6f6f';
    divTimer.style.paddingLeft = '8px';
    divTimer.style.borderLeft = '1px solid #373737';
    divTimer.style.textAlign = 'right';
    divTimer.style.width = '60px';

    var playButton = document.createElement('a');
    playButton.id = 'playButton';
    playButton.href = '#';
    playButton.innerHTML = 'Play';
    playButton.title = "Start cheat player";
    playButton.onclick = playMusic;
    var stopButton = document.createElement('a');
    stopButton.id = 'stopButton';
    stopButton.href = '#';
    stopButton.innerHTML = 'Stop';
    stopButton.onclick = stopMusic;
    stopButton.title = "Stop cheat player";
    var autoCheck = document.createElement('input');
    checkTitle = "Enable/Disable automatically music playing";
    autoCheck.id = 'autoCheck';
    autoCheck.type = 'checkbox';
    autoCheck.style.verticalAlign = 'middle';
    autoCheck.style.cursor = 'pointer';
    autoCheck.style.paddingLeft = '8px';
    autoCheck.style.borderLeft = '1px solid #373737';
    autoCheck.title = checkTitle;
    autoCheck.onchange = function () { listen(AUTO_UPDATE); };
    var autoCheckLabel = document.createElement('label');
    autoCheckLabel.id = 'autoCheckLabel';
    autoCheckLabel.htmlFor = 'autoCheck';
    autoCheckLabel.innerHTML = 'Automatically play';
    autoCheckLabel.style.color = '#FFFFFF';
    autoCheckLabel.style.cursor = 'pointer';
    autoCheckLabel.style.paddingTop = '4px';
    autoCheckLabel.style.paddingBottom = '4px';
    autoCheckLabel.style.paddingRight = '8px';
    autoCheckLabel.style.borderRight = '1px solid #6f6f6f';
    autoCheckLabel.title = checkTitle;

    var audioTag = buildAudioTag();

    var head = document.getElementsByTagName('head')[0];
    var styleTag = document.createElement('style');
    styleTag.type = 'text/css';
    styleTag.innerHTML=CSS;
    head.appendChild(styleTag);

    if (DEBUG > 2) {
        debug('Inserting cheat blocks in banner...');
    }
    links.insertBefore(divTimer, firstElement);
    links.insertBefore(audioTag, firstElement);
    links.insertBefore(playButton, firstElement);
    links.insertBefore(stopButton, firstElement);
    links.insertBefore(autoCheck, firstElement);
    links.insertBefore(autoCheckLabel, firstElement);
    if (DEBUG > 2) {
        debug('Cheats blocks inserted...');
    }

    TIMER=document.getElementById('musicquiz');
    if (!TIMER && DEBUG > 0) {
        warn('Can not find the flash timer.');
    }

    if (AUTO_UPDATE) {
        if (DEBUG > 2) {
            debug('Automatic play is enabled.');
        }
        autoCheck.checked = true;
    }

    if (DEBUG > 2) {
        debug('Cheat block created!');
    }
}

function checkUpdates() {
    var pastSongs = document.getElementById(TITLES_ID);
    if (pastSongs && pastSongs.style.display != 'none') {
        var oldNb = NB_TITLES;
        NB_TITLES = pastSongs.children.length;
        if (oldNb != NB_TITLES) {
            if (DEBUG > 2) {
                info('The music track changed.');
            }
            getURL(DEFAULT_CATEGORY);
        }
    }
    var container = document.getElementById(CONTAINER_ID);
    if (container) {
        var oldV = CONTAINER_VALUE;
        CONTAINER_VALUE = parseInt(container.innerHTML);
        if (CONTAINER_VALUE > 0 && oldV != CONTAINER_VALUE) {
            if (DEBUG > 2) {
                info('The music track started.');
            }
            if (!TIMER) {
                stopMusic();
            } else {
                if (DEBUG > 2) {
                    info('Flash timer stopped.');
                }
                TIMER.stopTimer();
                var duration = parseInt(document.getElementById('audioTag').duration);
                if (duration < 1) {
                }
                countDown(duration);
            }
        }
    }
}

function countDown(n) {
    COUNTDOWN.innerHTML=n;
    COUNTDOWN.style.color='#FFFFFF';
    if (n >= 0) {
        if (n < 10) {
            COUNTDOWN.style.color='#FF0000';
        }
        setTimeout(function() {countDown(n-1);}, 1000);
    }
}

function listen(param) {
    AUTO_UPDATE = !param;
    if (AUTO_UPDATE) {
        startListening();
    } else {
        stopListening();
    }
}

function stopListening() {
    if (DEBUG > 2) {
        debug('Stop listening.');
    }
    clearInterval(LISTENER);
}

function startListening() {
    if (DEBUG > 2) {
        debug('Start listening...');
    }
    LISTENER = setInterval(function() { checkUpdates(); }, UPDATE_INTERVAL);
}

function startScript() {
    if (DEBUG > 1) {
        info('Staring cheat Script...');
    }

    init();
    getURL(DEFAULT_CATEGORY);

    if (DEBUG > 1) {
        info('Cheat script started!');
    }

    if (AUTO_UPDATE) {
        startListening();
    }
}

setTimeout(startScript, START_DELAY);
