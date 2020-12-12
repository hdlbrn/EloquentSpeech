<template>
  <div>
    <tree-item :item="node" @toggleFolder="toggleFolder"></tree-item>
    <span class="new-session-btn" @click="openNewSession()">
      <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="plus-square" class="svg-inline--fa fa-plus-square fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M352 240v32c0 6.6-5.4 12-12 12h-88v88c0 6.6-5.4 12-12 12h-32c-6.6 0-12-5.4-12-12v-88h-88c-6.6 0-12-5.4-12-12v-32c0-6.6 5.4-12 12-12h88v-88c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v88h88c6.6 0 12 5.4 12 12zm96-160v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48zm-48 346V86c0-3.3-2.7-6-6-6H54c-3.3 0-6 2.7-6 6v340c0 3.3 2.7 6 6 6h340c3.3 0 6-2.7 6-6z"></path></svg>
    </span>
    <tree-item v-if="!!newSessionNode" :item="newSessionNode"></tree-item>
  </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue';

import TreeItem from './TreeItem.vue';

import { makeRequest } from '../util/request';
import constants from '../util/constants';

export default defineComponent({
  name: 'WorkspaceSidePanel',
  components: { TreeItem },
  props: {
    session: String,
  },
  data() {
    const selectedNode: any = {};
    const newSessionNode: any = {};
    return {
      node: {
        name: 'sessions',
        displayName: 'Sessions',
        isFolder: true
      },
      selectedNode,
      newSessionNode,
    }
  },
  watch: {
    session() {
      this.handleSessionChanged();
    }
  },
  mounted() {
    this.handleSessionChanged();
  },
  methods: {
    handleSessionChanged() {
      this.newSessionNode = undefined;

      if (!this.session) {
        return;
      }

      if (this.session === constants.NEW_SESSION_ID) {
        this.newSessionNode = {
          name: constants.NEW_SESSION_ID,
          displayName: 'Undefined',
          isFolder: false
        };
        this.updateSelectedNode(this.newSessionNode);
        return;
      }

      const paths = this.session.split('/').filter((p: string) => !!p);
      this.expandPaths(paths, this.node, '');
    },
    async toggleFolder(node: any, parentFullPath: string, isOpen: boolean) {
      const path = parentFullPath.replace('sessions/', '');
      
      if (!isOpen) {
        node.isOpen = false;
        return;
      }

      if (!node.isFolder) {
        this.$emit('openSession', path);
      } else {
        node.isLoading = true;
        node.isOpen = true;
        const result = await makeRequest('GET', `/sessions/${path}`);

        let children = JSON.parse(result).children;
        if (node.children) {
          const exisingChildrenPerName: any = {};
          node.children.forEach((c: any) => {
            exisingChildrenPerName[c.name] = c;
          });
          children = children.map((child: any) => {
            const existingChild = exisingChildrenPerName[child.name] || {};
            return Object.assign({}, existingChild, child);
          })
        }
        node.children = children;
        node.isLoading = false;
      }
    },

    updateSelectedNode(currentNode: any) {
      if (this.selectedNode) {
        this.selectedNode.selected = false;
      }
      this.selectedNode = currentNode;
      this.selectedNode.selected = true;
    },

    async expandPaths(paths: string[], currentNode: any, currentPath: string) {
      if (paths.length === 0) {
        this.updateSelectedNode(currentNode);
        return;
      }
      const path = paths.shift();

      let childNode = currentNode.children && currentNode.children.find((c: any) => c.name === path);
      if (!childNode) {
        currentNode.isLoading = true;
        const result = await makeRequest('GET', `/sessions/${currentPath}`);
        currentNode.children = JSON.parse(result).children;
        currentNode.isLoading = false;
        childNode = currentNode.children && currentNode.children.find((c: any) => c.name === path);
      }

      currentNode.isOpen = true;

      this.expandPaths(paths, childNode, `${currentPath}/${path}`);
    },

    openNewSession() {
      this.$emit('openSession', constants.NEW_SESSION_ID);
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: block;
}

.new-session-btn {
  width: 20px;
  height: 20px;
  display: block;
  position: absolute;
  right: 10px;
  top: 10px;
  cursor: pointer;
}
</style>
