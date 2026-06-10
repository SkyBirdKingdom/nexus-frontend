<template>
  <AuthView v-if="!authStore.isAuthenticated" />
  
  <div v-else class="app-layout">
    <Sidebar />
    <div class="main-workspace">
      <ChatWorkspace />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/layout/Sidebar.vue'
import ChatWorkspace from './views/ChatWorkspace.vue'
import AuthView from './views/AuthView.vue'
import { useAuthStore } from './stores/authStore'

// 获取全局鉴权状态
const authStore = useAuthStore()
</script>

<style>
body, html {
  margin: 0; padding: 0; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #fcfcfd;
}
#app { height: 100%; }
.app-layout { display: flex; width: 100vw; height: 100vh; overflow: hidden; }
.main-workspace { flex: 1; min-width: 0; display: flex; flex-direction: column; }
</style>