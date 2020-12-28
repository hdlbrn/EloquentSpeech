const ffmpeg = require('fluent-ffmpeg')
const transcribe = require('./transcribe');
const stream = require('stream');

class StreamToTranscribe extends stream.Writable {

  constructor(writeCallback, finalCallback) {
    super();
    this.writeCallback = writeCallback;
    this.finalCallback = finalCallback;
  }

  _write(chunk, enc, next) {
    this.writeCallback(chunk).then(r => {
      next();
    });
  }

  _final(callback) {
    this.finalCallback().then(r => {
      callback();
    });
  }
}

class TranscribeAudioJob {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async start() {
    let ended = false;
    console.log('Starting TranscribeAudioJob ' + this.filePath);
    const sessionId = await transcribe.initStreamingSession();
    this.ffmpegCommand = ffmpeg(this.filePath)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioBitrate('16k')
      .on('error', (err) => {
        console.error('Error TranscribeAudioJob ' + this.filePath, err);
      })
      .format('wav')
      .writeToStream(new StreamToTranscribe((chunk) => {
        if (ended) {
          return Promise.resolve();
        }

        console.log('Progressing TranscribeAudioJob ' + this.filePath);
        return transcribe.processAudioStream(chunk);
      }, () => {
        console.log('Ending TranscribeAudioJob ' + this.filePath);
        return transcribe.resetAudioStream();
      }), { end: true });

    return sessionId;
  }

  stop() {
    this.ffmpegCommand.kill();
  }

}

module.exports = TranscribeAudioJob;
