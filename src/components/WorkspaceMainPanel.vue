<template>
  <div>
      <div class="text-area">
        <template v-if="texts.length > 0 || !!intermediateText">
          <p v-for="(text, index) in texts" :key="index">{{ text }}</p>
          <p v-if="intermediateText">{{ intermediateText }}</p>
        </template>
        <template v-else>
          <span class="hint">Upload audio through the microphone or from file. Transcription will apear here</span>
        </template>
      </div>
      
      <div class="toolbar">
        <div>
          <label class="toggle">
            <input class="toggle-checkbox" type="checkbox" checked>
            <div class="toggle-switch"></div>
            <span class="toggle-label">Live results</span>
          </label>
        </div>
        <a class="mic-btn" :class="{active: recording}" @click="toggleMic()">
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="microphone" class="svg-inline--fa fa-microphone fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path></svg>
        </a>
        <div class="upload-audio">
          <input type="file" id="upload" hidden/>
          <label class="mic-btn" for="upload">
            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="file-audio" class="svg-inline--fa fa-file-audio fa-w-12" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M369.941 97.941l-83.882-83.882A48 48 0 0 0 252.118 0H48C21.49 0 0 21.49 0 48v416c0 26.51 21.49 48 48 48h288c26.51 0 48-21.49 48-48V131.882a48 48 0 0 0-14.059-33.941zM332.118 128H256V51.882L332.118 128zM48 464V48h160v104c0 13.255 10.745 24 24 24h104v288H48zm144-76.024c0 10.691-12.926 16.045-20.485 8.485L136 360.486h-28c-6.627 0-12-5.373-12-12v-56c0-6.627 5.373-12 12-12h28l35.515-36.947c7.56-7.56 20.485-2.206 20.485 8.485v135.952zm41.201-47.13c9.051-9.297 9.06-24.133.001-33.439-22.149-22.752 12.235-56.246 34.395-33.481 27.198 27.94 27.212 72.444.001 100.401-21.793 22.386-56.947-10.315-34.397-33.481z"></path></svg>
          </label>
        </div>
      </div>
  </div>
</template>

<script lang="ts">

declare const WebVoiceProcessor: any;
declare const process: any;

import { defineComponent } from 'vue';

import io from 'socket.io-client';

import { baseUrl } from '../util/request';

export default defineComponent({
  name: 'WorkspaceMainPanel',
  props: {
    model: Object,
    session: String
  },
  data() {
    const audioContext: any = {};
    const processorInternal: any = {};
    const mediaStreamSource: any = {};
    const socket: any = {};
    const localModel: any = {
      texts: []
    };
    return {
      recording: false,
      connected: false,
      audioContext,
      processorInternal,
      mediaStreamSource,
      socket,
      localModel,
      intermediateText: ''
    }
  },
  computed: {
    texts() {
      let texts: string[] = [];
      if (this.model?.texts) {
        texts = texts.concat(this.model.texts);
      }

      texts = texts.concat(this.localModel.texts);

      return texts;
    }
  },
  mounted() {
    const socketUrl = process.env.VUE_APP_SOCKET_URL || baseUrl;

    this.socket = io.connect(socketUrl, {});

    this.socket.on('connect', () => {
      console.log('socket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.stopMic();
    });

    this.socket.on('recognize', (result: any) => {
      console.log('recognized:', result);

      if (result) {
        if (result.intermediate) {
          this.intermediateText += result.text + ' ';
        } else {
          this.localModel.texts.push(result.text);
          this.intermediateText = '';
        }
      }
    });
  },
  methods: {
    toggleMic() {
      if (this.recording) {
        this.stopMic();
      } else {
        this.startMic();
      }
    },
    startMic() {
      this.recording = true;
      WebVoiceProcessor.start((data: any) => {
        if (this.socket.connected) {
          this.socket.emit('stream-data', data.buffer);
        }
      }, (err: any) => {
        alert('some problem ' + err);
      });
    },
    stopMic() {
      this.recording = false;
      if (this.socket.connected) {
        this.socket.emit('stream-reset');
      }
      WebVoiceProcessor.stop()
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$el.querySelector(".messaging");
        container.scrollTop = container.scrollHeight;
      });
    },
  }
});
</script>

<style lang="scss" scoped>

.text-area{
  height: 100%;
  text-align: left;
  padding: 10px;
  box-sizing: border-box;

  .hint {
    text-align: center;
    font-style: italic;
  }
}

.toolbar {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  margin-left: auto;
  margin-right: auto;
}

.round-btn {
  display: inline-block;
  text-decoration: none;
  background: #0DEE00;
  color: #0DEE00;
  border-radius: 50%;
  overflow: hidden;
  font-weight: bold;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.29);
  border-bottom: solid 3px #027c10;
  text-shadow: -1px -1px rgba(255, 255, 255, 0.43), 1px 1px rgba(0, 0, 0, 0.49);

  width: 30px;
  height: 30px;
  line-height: 30px;

  cursor: pointer;

  svg {
    color: black;
    height: 50%;
    transition: .2s;
        vertical-align: middle;
  }
}

.round-btn:active, .round-btn.active {
  -ms-transform: translateY(2px);
  -webkit-transform: translateY(2px);
  transform: translateY(2px);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.35);
}

.mic-btn {
  @extend .round-btn;
  width: 60px;
  height: 60px;
  line-height: 60px;
  transition: .2s;
  display: inline-block;
  vertical-align: top;
}

.mic-btn:active, .mic-btn.active {
  svg {
    color: #c12222;
  }
}

.toolbar > * {
  margin-left: 10px;
  margin-right: 10px;
  display: inline-block;
  vertical-align: middle;
}

</style>
