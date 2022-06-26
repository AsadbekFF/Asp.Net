window.onload = initWebAudio;
var audioContext;
var bufLoader;
var audioLoop;

function initWebAudio() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
}

function playAudio(media,loop=false) {
    audioContext = new AudioContext();
    audioLoop = false;
    audioLoop = loop;
    bufLoader = new BufferLoader(audioContext, media, playAudioCallback);
    bufLoader.load();
}

function playAudioCallback(media) {
    if (media && media[0]) {
        var source = audioContext.createBufferSource();
        source.buffer = media[0];
        source.connect(audioContext.destination);
        source.start(0);
        source.loop = audioLoop;

        source.addEventListener('ended', function() {
            audioContext.close();
        });

    } else {
        audioContext.close();
        console.log('no media');
    }
}

function stopAudio() {
    if ( audioContext && audioContext.state !== 'closed') {
        audioContext.close();
    }
}

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    };

    request.onerror = function() { console.error('BufferLoader: XHR error');};
    request.send();
};

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
};
