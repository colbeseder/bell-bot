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
    var HIGH = 40; // %
    var BREAK = 750; // ms
    var reactions = ["👍", "❤️", "👏"];
    var user = 1; //TODO!

    /* For debugging */
    function log(msg) {
        document.getElementById('debug').innerText += "\n" + msg;
    }

    log("Version 0.1");

    /* Sending and Displaying Messages */
    function sendMessage(msg) {
        //TODO: Send the message to Teams!
        postMessage(msg, "mine");
    }

    function receiveMessage(msg) {
        postMessage(msg, "theirs");
        speak(msg);
    }

    var loadedMessages = new Set(); ;
    function processMessage(obj) {
        if (loadedMessages.has(obj.id)) {
            return;
        }
        if (obj.from === "me") {
            postMessage(obj.body, "mine", obj.from);
        } else {
            postMessage(obj.body, "theirs", obj.from);
            speak(obj.body);
        }
        loadedMessages.add(obj.id);
    }

    function get_messages() {
        fetch("messages/" + user + ".json?v=" + Date.now())
        .then(r => r.json())
        .then(data => data.messages.forEach(processMessage));
    }

    function postMessage(msg, className, from) {
        from = from || "";
        var nameboxDiv = document.createElement("div");
        nameboxDiv.classList = "namebox";
        nameboxDiv.innerText = from;

        var detailsDiv = document.createElement("div");
        detailsDiv.classList = "details";
        var d = new Date();
        var h = (d.getHours() % 12) || 12;
        var m = ("0" + d.getMinutes()).slice(-2);
        var AMPM = d.getHours() < 12 ? "AM" : "PM";
        detailsDiv.innerText = h + ":" + d.getMinutes() + " " + AMPM;

        var messageDiv = document.createElement("div");
        messageDiv.classList = "content";
        messageDiv.innerText = msg;

        var outerDiv = document.createElement("div");
        outerDiv.className = className;
        outerDiv.appendChild(nameboxDiv);
        outerDiv.appendChild(detailsDiv);
        outerDiv.appendChild(messageDiv);
        document.getElementById("chat").appendChild(outerDiv);
    }

    /* Text-to-speech */
    function speak(msg) {
        try {
            let speech = new SpeechSynthesisUtterance();
            speech.lang = "en-US";
            speech.volume = 1;
            speech.rate = 1;
            speech.pitch = 1;
            speech.text = msg;
            window.speechSynthesis.speak(speech);
        } catch (er) {
            log(er);
        }
    }

    /* Ring Detection & Counting */

    /* State for ring debouncing */
    var isHigh = false;
    var lastHigh = Date.now();
    var rings = 0;

    function debounceRings(val, callback) {
        document.getElementById('vol').innerText = val;
        // Ringing:
        if (val >= HIGH) {
            document.getElementById('vol').style.color = "red";
            // Ring Just started:
            if (!isHigh) {
                rings++;
            }
            lastHigh = Date.now();
            isHigh = true;
        }
        // Quiet (not ringing):
        else if (val < HIGH) {
            document.getElementById('vol').style.color = "black";
            // Ringing has stopped. Send reaction.
            if (rings && !isHigh && (lastHigh + BREAK) < Date.now()) {
                callback(rings);
                rings = 0;
            }
            isHigh = false;
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
            alert("Microphone read error");
        });
    }

    function react(rings) {
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

    /* Testing */
    function clap() {
        // simulate a short, loud noise
        debounceRings(HIGH + 1, react);
    }
    window.clap = clap;

    function test() {
        console.log("running tests");
        var testFunctions = [
            function () {
                receiveMessage("Hi...")
            },
            function () {
                receiveMessage("I've just solved that problem you were having!")
            },
            clap,
            function () {},
            clap,
            clap,
            function () {},
            clap,
            clap,
            clap,
            function () {},
            clap,
            clap,
            clap,
            clap
        ];

        var idx = 0;
        var tm = setInterval(function () {
                if (idx >= testFunctions.length) {
                    clearInterval(tm);
                    return;
                }
                testFunctions[idx]();
                idx++;
            }, BREAK * 0.7);

    }

    function devMode() {
        if (/log/.test(location.hash)) {
            document.getElementById("logging").style.display = "block";
        }

        var r = /v=(\d+)/;
        var matches = r.exec(location.hash);
        if (matches) {
            HIGH = parseInt(matches[1], 10);
			log("Volume threshold is " + HIGH);
        }
    }

    /* Start */
	devMode();
    window.init = function (button) {
        button.style.display = 'none';
        getVolume(react);
        if (location.hash === "#test") {
            test();
        } else {
            get_messages();
            setInterval(get_messages, 1000);
        }
        console.log('Ready.');
    }
})();
