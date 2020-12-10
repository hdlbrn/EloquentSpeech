WebVoiceProcessor = (function () {
    var audioContext;
    var mediaStream;
    var mediaStreamSource;
    var processor;
    var initialized;
    var downsampler;

    var messageHandler;

    var isRecording = function() {
        return !!messageHandler;
    }

    var createAudioProcessor = function(audioContext, audioSource) {
		var processorInternal = audioContext.createScriptProcessor(4096, 1, 1);
		
		const sampleRate = audioSource.context.sampleRate;
        
        if (!downsampler) {
            downsampler = new Worker('/web-voice-processor/downsampling_worker.js');
            downsampler.onmessage = (e) => {
                if (messageHandler) {
                    messageHandler(e.data);
                }
            };
        }

        downsampler.postMessage({command: "init", inputSampleRate: sampleRate});
		
		processorInternal.onaudioprocess = (event) => {
            if (isRecording()) {
			    var data = event.inputBuffer.getChannelData(0);
                downsampler.postMessage({command: "process", inputFrame: data});
            }
		};
		
		processorInternal.shutdown = () => {
			processorInternal.disconnect();
			processorInternal.onaudioprocess = null;
		};
		
		processorInternal.connect(audioContext.destination);
		
		return processorInternal;
    }

    var start = function (handler, errorCallback) {
        messageHandler = handler;

        if (!initialized) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(stream => {
                    mediaStream = stream;
                    mediaStreamSource = audioContext.createMediaStreamSource(stream);
                    processor = createAudioProcessor(audioContext, mediaStreamSource);
                    mediaStreamSource.connect(processor);
                    initialized = true;
                })
                .catch(errorCallback);
        } else {
            // if (mediaStream) {
            //     mediaStream.getTracks()[0].enabled = true;
            // }
            // if (audioContext) {
            //     audioContext.resume();
            // }
        }
    };

    var stop = function () {
        if (downsampler) {
            downsampler.postMessage({command: "reset"});
        }
        messageHandler = null;

        // if (mediaStream) {
        //     mediaStream.getTracks()[0].enabled = false;
		// }
        // if (audioContext) {
        //     audioContext.suspend();
        // }
    };

    var cleanup = function () {
        if (mediaStream) {
            mediaStream.getTracks()[0].stop();
            mediaStream = undefined;
		}
		if (mediaStreamSource) {
            mediaStreamSource.disconnect();
            mediaStreamSource = undefined;
		}
		if (processor) {
            processor.shutdown();
            processor = undefined;
		}
		if (audioContext) {
            audioContext.close();
            audioContext = undefined;
        }
        
        initialized = false;
    };



    return {start: start, stop: stop, cleanup: cleanup};
})();
