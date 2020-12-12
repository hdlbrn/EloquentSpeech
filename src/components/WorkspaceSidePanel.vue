<template>
  <tree-item :item="node" @toggleFolder="toggleFolder"></tree-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import TreeItem from './TreeItem.vue';

import { makeRequest } from '../util/request';

export default defineComponent({
  name: 'WorkspaceSidePanel',
  components: { TreeItem },
  props: {
    session: String,
  },
  data() {
    const selectedNode: any = {};
    return {
      node: {
        name: 'sessions',
        displayName: 'Sessions',
        isFolder: true
      },
      selectedNode
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
      if (!this.session) {
        return;
      }
      const paths = this.session.split('/').filter((p: string) => !!p);
      this.expandPaths(paths, this.node, '');
    },
    async toggleFolder(node: any, parentFullPath: string, isOpen: boolean) {
      const path = parentFullPath.replace('sessions/', '');
      debugger;

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

    async expandPaths(paths: string[], currentNode: any, currentPath: string) {
      if (paths.length === 0) {
        if (this.selectedNode) {
          this.selectedNode.selected = false;
        }
        this.selectedNode = currentNode;
        this.selectedNode.selected = true;
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
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
}
a {
  color: #42b983;
}
</style>
