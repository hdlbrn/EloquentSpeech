const fs = require('fs').promises;
const pathJoin = require('path').join;
const DeepSpeech = require('deepspeech');
const VAD = require('node-vad');
const { v4: uuidv4 } = require('uuid');
const WavFileWriter = require('wav').FileWriter;

const DEEPSPEECH_MODEL = './deepspeech-models/'; // path to deepspeech english model directory

const BASE_SESSIONS_FOLDER = `${global.APP_PATH}/storedaudios`;

const LEAF_FOLDER_REGEX = /\d\dc\d\dc\d\dd\d\d\dZ/;
const LEAF_FOLDER_ISO_REGEX = /\d\d:\d\d:\d\d\.\d\d\dZ/;

const Queue = require('./queue');
const VAD_MODE = VAD.Mode.VERY_AGGRESSIVE;
const vad = new VAD(VAD_MODE);

function createModel(modelDir) {
  const modelPath = modelDir + 'de.pbmm';
  const scorerPath = modelDir + 'de.scorer';
  const model = new DeepSpeech.Model(modelPath);
  model.enableExternalScorer(scorerPath);
  return model;
}

const englishModel = createModel(DEEPSPEECH_MODEL);
let modelStream = null;
let recordedChunks = 0;
let silenceStart = null;
let recordedAudioLength = 0;
let endTimeout = null;
let silenceBuffers = [];

let writeStream = undefined;
let currentStreamingSession = undefined;
let writeStreamPromise = undefined;
let intermediateResults = undefined;
let supportLiveResults = true;

let SILENCE_THRESHOLD = 200;

let queue = new Queue();

async function maybeHandleLiveResults(data) {
  const res = await vad.processAudio(data, 16000);
  
  switch (res) {
    case VAD.Event.ERROR:
      console.log('VAD ERROR');
      break;
    case VAD.Event.NOISE:
      console.log('VAD NOISE');
      break;
    case VAD.Event.SILENCE:
      if (!silenceStart) {
        silenceStart = new Date().getTime();
      }
      
      const now = new Date().getTime();
      if (now - silenceStart > SILENCE_THRESHOLD) {
        silenceStart = null;
        const result = decodeStream(true);
        intermediateResults.push(result);
        return result;
      }
      break;
    case VAD.Event.VOICE:
      silenceStart = null;
      break;
    default:
      console.log('default', res);
  }
}

function isoStringToFs(string) {
  return string.replace(/:/g, 'c').replace(/\./g, 'd');
}

function fsToISOString(string) {
  return string.replace(/c/g, ':').replace(/d/g, '.');
}

async function initStreamingSession(session) {
  if (writeStream) {
    return;
  }

  const date = new Date().toISOString(); // 2020-11-17T19:08:15.511Z
  const yearAndMonth = date.substring(0, 7); // 2010-11
  const day = date.substring(8, 10); // 17
  const time = isoStringToFs(date.substring(11));

  if (session) {
    session = encodeLastLeafFolderIfNeeded(session).path;
  } else {
    session = `${yearAndMonth}/${day}/${time}`;
  }

  currentStreamingSession = pathJoin(session, uuidv4());

  await fs.mkdir(pathJoin(BASE_SESSIONS_FOLDER, session), { recursive: true });

  writeStream = new WavFileWriter(pathJoin(BASE_SESSIONS_FOLDER, `${currentStreamingSession}.wav`), {
    sampleRate: 16000,
    bitDepth: 16,
    channels: 1
  });

  modelStream = englishModel.createStream();
  recordedChunks = 0;
  recordedAudioLength = 0;
  intermediateResults = [];
}

async function processAudioStream(data) {
  if (!writeStream) {
    await queue.enqueue(() => initStreamingSession());
  }

  writeStream.write(data);

  feedAudioContent(data);

  clearTimeout(endTimeout);
  endTimeout = setTimeout(() => {
    console.log('timeout');
    resetAudioStream();
  }, 5000);

  if (supportLiveResults) {
    return await queue.enqueue(() => maybeHandleLiveResults(data));
  }
}

async function resetAudioStream() {
  // adding this in queue so that any previous adio processing will be done before we finish the stream session
  return await queue.enqueue(() => new Promise((res, rej) => {
    clearTimeout(endTimeout);
    res(finishStreamSession());
  }));
}

function decodeStream(intermediate) {
  const start = new Date();
	const text = modelStream.finishStream();
  const recogTime = new Date().getTime() - start.getTime();
  const result = {
    text,
    recogTime,
    audioLength: Math.round(recordedAudioLength),
    intermediate: !!intermediate
  };
  if (intermediate) {
    modelStream = englishModel.createStream();
  }

  console.log('recognized: ', result);
	return result;
}

function decodeBuffer(buffer) {
  const start = new Date();
	const text = englishModel.stt(buffer);
  const recogTime = new Date().getTime() - start.getTime();
  const result = {
    text,
    recogTime
  };

  console.log('recognized: ', result);
	return result;
}

async function finishStreamSession() {
  let result;
  if (modelStream) {
    result = decodeStream(false);
  }

  let allResults = [].concat(intermediateResults);
  allResults.push(result);
  allResults = allResults.filter(r => !!r);

  if (currentStreamingSession) {
    fs.writeFile(`${BASE_SESSIONS_FOLDER}/${currentStreamingSession}.json`, JSON.stringify(allResults));
  }

  silenceBuffers = [];
  modelStream = null;

  recordedChunks = 0;
  silenceStart = null;

  if (writeStream) {
    writeStream.end();
  }

  writeStream = null;
  currentStreamingSession = null;
  writeStreamPromise = null;
  intermediateResults = null;

  return result;
}

async function transcribeFile(file) {
  console.log('Transcribing ' + file);
  const buffer = await fs.readFile(file);
  
  const result = decodeBuffer(buffer);

  let allResults = [result];
  
  fs.writeFile(`${file.replace('.wav', '.json')}`, JSON.stringify(allResults));
  return result;
}

function feedAudioContent(chunk) {
  recordedAudioLength += (chunk.length / 2) * (1 / 16000) * 1000;
  modelStream.feedAudioContent(chunk);
}

function isLeafFolder(folder) {
  return folder && folder.match(LEAF_FOLDER_REGEX);
}

function isLeafFolderIso(folder) {
  return folder && folder.match(LEAF_FOLDER_ISO_REGEX);
}

function getFileContent(file, currentFolder) {
  const statsPromise = fs.stat(currentFolder + '/' + file);
  const readPromise = fs.readFile(currentFolder + '/' + file, 'UTF-8');

  return Promise.all([statsPromise, readPromise]).then(r => {
    return {
      name: file,
      time: r[0].mtime.getTime(),
      content: r[1]
    }
  });
}

async function getFilesContentOrderedByDate(files, currentFolder) {
  const filesWithContentPromises = files
    .filter(f => f.endsWith('.json'))
    .map(f => getFileContent(f, currentFolder));

  let filesWithContent = [];
  if (filesWithContentPromises.length > 0) {
    filesWithContent = await Promise.all(filesWithContentPromises);
  }

  return filesWithContent
  .sort((a, b) => a.time - b.time)
  .map(fc => {
    return {
      recognitions: fc.content ? JSON.parse(fc.content) : null,
      audio: fc.name.replace('.json', '.wav'),
      fullPath: currentFolder.replace(BASE_SESSIONS_FOLDER, '') + '/'
    }
  });
}

function encodeLastLeafFolderIfNeeded(path) {
  const startsWithSlash = path.startsWith('/');

  const paths = path.split('/').filter(p => !!p);
  let currentPath = paths.pop();
  const isLeafFolderValue = isLeafFolderIso(currentPath);
  if (isLeafFolderValue) {
    currentPath = isoStringToFs(currentPath);
  }
  paths.push(currentPath);

  path = '';
  if (startsWithSlash) {
    path += '/';
  }
  path += paths.join('/');

  return {
    path,
    isLeafFolderValue
  }
}

async function getSessionsInternal(path) {
  console.log('getSessionsInternal ' + path);
  let encoded = encodeLastLeafFolderIfNeeded(path);
  
  const files = await fs.readdir(encoded.path);
  if (encoded.isLeafFolderValue) {
    return getFilesContentOrderedByDate(files, encoded.path);
  } else {
    return {
      children: files.map(f => {
        let isLeafFolderValue = isLeafFolder(f);

        return {
          name: isLeafFolderValue ? fsToISOString(f) : f,
          isFolder: !isLeafFolderValue
        }
      }),
      fullPath: encoded.path.replace(BASE_SESSIONS_FOLDER, '') + '/'
    };
  }
}

async function getSessions(path) {
  return getSessionsInternal(pathJoin(BASE_SESSIONS_FOLDER, path));
}

module.exports = {
  initStreamingSession,
  processAudioStream,
  resetAudioStream,
  getSessions,
  transcribeFile
}