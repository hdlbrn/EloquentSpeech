console.log('Node version: ', process.version);


global.APP_PATH = global.APP_PATH || '.';

console.log('global.APP_PATH ' + global.APP_PATH);

const express = require('express');
const multer = require('multer')
const http = require('http');
const app = express();
const socketIO = require('socket.io');
const transcribe = require('./transcribe');
const TranscribeAudioJob = require('./transcribe-audio-job');

const { v4: uuidv4 } = require('uuid');

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/sessions/*', function (req, res) {
  transcribe.getSessions(req.params[0]).then(sessions => {
    res.json(sessions);
  }).catch(e => {
    res.status(400).send(e);
  })
});

app.get('/audios/:path', function (req, res) {
  if (!req.params.path || !req.params.path.endsWith('.wav')) {
    return res.sendStatus(httpResponseCodes.INTERNAL_SERVER_ERROR);
  }
  res.sendFile(path, { root: `${global.APP_PATH}/storedaudios/${eq.params.path}` });
});


const multerStorage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, `${global.APP_PATH}/uploadedaudios/`);
  },

  filename: function(req, file, cb) {
      cb(null, uuidv4() + '-' + file.originalname);
  }
});

app.post('/transcribe-job', (req, res) => {

  let upload = multer({ storage: multerStorage }).single('media_file');

  upload(req, res, function (err) {
    if (req.fileValidationError) {
      return res.send(req.fileValidationError);
    }
    else if (!req.file) {
      return res.send('Please select an image to upload');
    }
    else if (err instanceof multer.MulterError) {
      return res.send(err);
    }
    else if (err) {
      return res.send(err);
    }

    new TranscribeAudioJob(req.file.path).start().then(sessionId => {
      res.json({
        sessionId
      });
    });
  });
});

const server = http.createServer(app);

const io = socketIO(server, {
  serveClient: false
});
io.set('origins', '*:*');

io.on('connection', function (socket) {
  console.log('client connected');
  socket.once('disconnect', () => {
    console.log('client disconnected');
    transcribe.resetAudioStream();
  });

  socket.on('stream-init', function (config) {
    config = config || {};
    transcribe.initStreamingSession(config.session);
  });

  socket.on('stream-data', function (data) {
    transcribe.processAudioStream(data).then(result => {
      socket.emit('recognize', result);
    });
  });

  socket.on('stream-reset', function () {
    console.log('reset ');
    transcribe.resetAudioStream().then(result => {
      socket.emit('recognize', result);
    });
  });
});

module.exports = {
  listen(port) {
    return new Promise((res, rej) => {
      server.listen(port, function() {
        const port = this.address().port;
        res(port);
        console.log('Socket server listening on:', port);
      });
    })
  }
}
