declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vuejs-tree';

interface Window {
  webkitAudioContext: typeof AudioContext,
  remotePort: typeof Number
}

declare namespace NodeJS {
  interface Global {
    remotePort: typeof Number,
    APP_PATH: typeof string
  }
}

