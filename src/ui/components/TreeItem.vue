<template>
  <li>
    <div :class="{ folder: isFolder, active: item.selected }" class="item" @click="toggle">
      <span v-if="item.selected" class="background">
      </span>
      <span v-if="isFolder">
        <span class="icon">
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-down" :class="{ rotate: !item.isOpen }" class="svg-inline--fa fa-chevron-down fa-w-14 chevron" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path></svg>
        </span>
      </span>
      {{ item.displayName || item.name }}
    </div>
    <ul v-show="item.isOpen" v-if="isFolder">
      <template v-if="item.children">
        <tree-item
          class="item"
          v-for="(child, index) in item.children"
          :key="index"
          :item="child"
          @toggleFolder="redispatchToggleFolder"
        ></tree-item>
      </template>
      <template v-else-if="item.isLoading">
        <span class="icon">
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="spinner" class="svg-inline--fa fa-spinner fa-w-16 spin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"></path></svg>
        </span>
        Loading...
      </template>
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "TreeItem",
  props: {
    item: Object,
    parentFullPath: String
  },
  computed: {
    isFolder(): boolean {
      return this.item?.children?.length > 0 || this.item?.isFolder;
    },
  },
  methods: {
    toggle: function () {
      if (!this.item) {
        return;
      }
     
      this.redispatchToggleFolder(this.item, '', !this.item.isOpen);
    },
    redispatchToggleFolder(node: any, fullPath: string, isOpen: boolean) {
      this.$emit('toggleFolder', node, this.item!.name + '/' + fullPath, isOpen)
    }
  },
});
</script>

<style lang="scss" scoped>

.item {
  cursor: pointer;
  position: relative;

  .background {
    position: absolute;
    top: 0;
    right: -500px;
    bottom: 0;
    left: -500px;
    background-color: #1f8eff6e;
  }
}

.item.folder {
  font-weight: bold;
}

.item.active {
  color: #FFFFFF;
}

.icon {
  width: 14px;
  height: 14px;
  display: inline-block;
}

.spin {
  animation: spin 2s infinite linear;
}

.chevron {
  transition: transform 1s;
  transform: rotate(0deg);
}
.chevron.rotate {
  transform: rotate(-90deg);
}

ul {
  margin: 0 0 0 16px;
  padding: 0;
}

li {
  margin: 0;
  text-align: left;
  display: block;
}
@keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(1turn);
    transform: rotate(1turn);
  } 
}
</style>