import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Workspace from '@/views/Workspace.vue'
import Settings from '@/views/Settings.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/workspace'
  },
  {
    path: '/workspace',
    name: 'Workspace',
    component: Workspace
  },
  {
    path: '/workspace/:session(.*)',
    name: 'WorkspaceWithSession',
    component: Workspace
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
})

export default router
