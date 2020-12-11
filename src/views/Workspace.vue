<template>
  <workspace-side-panel :session="session" @openSession="openSession" class="side-panel"></workspace-side-panel>
  <workspace-main-panel :session="session" class="main-panel"></workspace-main-panel>
</template>

<script lang="ts">
import WorkspaceSidePanel from '@/components/WorkspaceSidePanel.vue';
import WorkspaceMainPanel from '@/components/WorkspaceMainPanel.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Workspace',
  components: { WorkspaceSidePanel, WorkspaceMainPanel },
  data() {
    return {
      session: ''
    }
  },
  watch: {
    $route() {
      this.session = '' + this.$route.params.session;
    }
  },
  mounted() {
    this.session = '' + this.$route.params.session;
  },
  methods: {
    openSession(path: string) {
      this.$router.push('/workspace/' + path);
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.side-panel {
  position: absolute;
  left: 0;
  width: 300px;
  top: 0;
  bottom: 0;
  padding: 10px;
  overflow: auto;
  box-sizing: border-box;
}

.main-panel {
  position: absolute;
  left: 300px;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>
