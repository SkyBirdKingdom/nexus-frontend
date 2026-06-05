<template>
  <div class="app-layout">
    <Sidebar />
    
    <div class="main-workspace">
      <ChatWorkspace />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/layout/Sidebar.vue'
import ChatWorkspace from './views/ChatWorkspace.vue'
</script>

<style>
/* 极其轻量的全局 CSS 重置 */
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f8fafc;
}

#app {
  height: 100%;
}

/* 核心布局：Flexbox 将侧边栏和工作台并排 */
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main-workspace {
  flex: 1;
  min-width: 0; /* 防止内容撑破 Flex 容器 */
  display: flex;
  flex-direction: column;
}
</style>