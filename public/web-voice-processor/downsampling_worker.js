onmessage = function (e) {
    switch (e.data.command) {
        case "init":
            init(e.data.inputSampleRate);
            break;
        case "process":
            process(e.data.inputFrame);
            break;
        case "reset":
            reset();
            break;
    }
};

var inputSampleRate;
var inputBuffer = [];

function init(x) {
    inputSampleRate = x;
}

function process(inputFrame) {
    for (let i = 0; i < inputFrame.length; i++) {
        inputBuffer.push((inputFrame[i]) * 32767);
    }

    const PV_SAMPLE_RATE = 16000;
    const PV_FRAME_LENGTH = 512;

    while ((inputBuffer.length * PV_SAMPLE_RATE / inputSampleRate) > PV_FRAME_LENGTH) {
        var outputFrame = new Int16Array(PV_FRAME_LENGTH);
        var sum = 0;
        var num = 0;
        var outputIndex = 0;
        var inputIndex = 0;

        while (outputIndex < PV_FRAME_LENGTH) {
            sum = 0;
            num = 0;
            while (inputIndex < Math.min(inputBuffer.length, (outputIndex + 1) * inputSampleRate / PV_SAMPLE_RATE)) {
                sum += inputBuffer[inputIndex];
                num++;
                inputIndex++;
            }
            outputFrame[outputIndex] = sum / num;
            outputIndex++;
        }

        postMessage(outputFrame);

        inputBuffer = inputBuffer.slice(inputIndex);
    }
}

function reset() {
    inputBuffer = [];
}
