/*
 * This script governs:
 *     posting messages to the UI
 *     Text-to-speech
 *     Recognizing (and debouncing) bell rings
 *
 * Set URL hash to "test" to run in test mode
 *
 */

(function () {
    const HIGH = 40; // %
    const BREAK = 750; // ms
    var reactions = ["👍", "❤️", "👏"];

    // State for ring debouncing
    var isHigh = false;
    var lastLow = Date.now();
    var lastHigh = Date.now();
    var rings = 0;

    let speech = new SpeechSynthesisUtterance();

    function postMessage(msg, className) {
        var d = document.createElement("div");
        d.innerText = msg;
        d.className = className;
        document.getElementById("chat").appendChild(d);
    }

    function sendMessage(msg) {
        //TODO: Send the message to Teams!
        postMessage(msg, "mine");
    }

    function receiveMessage(msg) {
        postMessage(msg, "theirs");
        speak(msg);
    }

    function speak(msg) {
        speech.lang = "en-US";
        speech.text = msg;
        speech.volume = 1;
        speech.rate = 1;
        speech.pitch = 1;
        window.speechSynthesis.speak(speech);
    }

    function debounceRings(val, callback) {
        // Ringing:
        if (val >= HIGH) {
            // Ring Just started:
            if (!isHigh) {
                rings++;
            }
            lastHigh = Date.now();
            isHigh = true;
        }
        // Quiet (not ringing):
        else if (val < HIGH) {
            // Ringing has stopped. Send reaction.
            if (rings && !isHigh && (lastHigh + BREAK) < Date.now()) {
                callback(rings);
                rings = 0;
            }
            isHigh = false;
            lastLow = Date.now();
        }
    }

    function getVolume(callback) {

        navigator.mediaDevices.getUserMedia({
            audio: true
        })
        .then(function (stream) {
            var audioContext = new AudioContext();
            var analyser = audioContext.createAnalyser();
            var microphone = audioContext.createMediaStreamSource(stream);
            var javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);
            javascriptNode.onaudioprocess = function () {
                var array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                var values = 0;

                var length = array.length;
                for (var i = 0; i < length; i++) {
                    values += (array[i]);
                }

                var average = values / length;

                debounceRings(average, callback);
            }
        })
        .catch(function (err) {
            console.log("Microphone read error");
        });
    }

    function react(rings) {
        console.log(rings);
        msg = "";
        if (rings <= reactions.length) {
            msg = reactions[rings - 1];
        } else {
            for (var i = 0; i < (rings - 2); i++) {
                msg += reactions[1];
            }
        }
        sendMessage(msg + "\n ");
    }

    // For testing
    function clap() {
        debounceRings(HIGH + 1, react);
    }

    function test() {
        console.log("Starting tests");
        var tests = [
            function () {
                receiveMessage("I've just solved that problem you were having!")
            },
            function () {
                clap()
            },
            function () {},
            function () {
                clap()
            },
            function () {
                clap()
            },
            function () {},
            function () {
                clap()
            },
            function () {
                clap()
            },
            function () {
                clap()
            }
        ];

        var idx = 0;
        var tm = setInterval(function () {
                if (idx >= tests.length) {
                    clearInterval(tm);
                    return;
                }
                var nextTest = tests[idx];
                nextTest();
                idx++;
            }, BREAK * 0.7);

    }

    if (location.hash === "#test") {
        console.log("test mode");
        document.getElementById("bye").addEventListener("click", test);
    }

    getVolume(react);
    console.log('Ready.')
})();
