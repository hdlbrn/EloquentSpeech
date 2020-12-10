<template>
  <div class="app-content dark-mode">
    <palette class="palette"></palette>
    <div class="main-content background">
      <router-view/>
    </div>
  </div>
</template>

<script lang="ts">
import Palette from '@/components/Palette.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App',
  components: { Palette }
});

</script>

<style lang="scss">

@import './styles.scss';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
}

.app-content {
  height: 100%;
}

.palette {
  width: 30px;
  height: 100%;
}

.main-content {
  position: absolute;
  left: 30px;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>
