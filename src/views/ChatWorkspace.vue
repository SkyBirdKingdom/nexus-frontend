<template>
  <div class="chat-container">
    <header class="chat-header">
      <div class="header-left">
        <h2>Nexus Agentic RAG</h2>
        <el-tag type="success" effect="light" round size="small">M4 Pro Engine Online</el-tag>
      </div>
      <div class="header-right">
        <el-button type="danger" plain size="small" @click="chatStore.clearChat">
          <el-icon><Delete /></el-icon> 清空会话
        </el-button>
      </div>
    </header>

    <el-scrollbar ref="scrollbarRef" class="chat-main" always>
      <div class="message-list">
        <div 
          v-for="(msg, index) in chatStore.messages" 
          :key="index"
          :class="['message-row', msg.role === 'user' ? 'user-row' : 'ai-row']"
        >
          <div class="avatar">
            <el-avatar :size="40" :style="{ background: msg.role === 'user' ? '#3b82f6' : '#10b981' }">
              {{ msg.role === 'user' ? 'U' : 'AI' }}
            </el-avatar>
          </div>
          
          <div class="bubble">
            <template v-if="msg.role === 'user'">
              {{ msg.content }}
            </template>
            
            <template v-else>
              <TraceTimeline 
                v-if="chatStore.isGenerating && index === chatStore.messages.length - 1" 
                :traces="chatStore.agentTraces" 
              />
              
              <MarkdownView v-if="msg.content" :content="msg.content" :sources="msg.sources" />
            </template>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <footer class="chat-footer">
      <div class="input-wrapper">
        <el-input
          v-model="userInput"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 6 }"
          placeholder="向 Nexus 提问... (Enter 发送，Shift + Enter 换行)"
          @keydown="handleKeydown"
          :disabled="chatStore.isGenerating"
          resize="none"
          class="custom-el-input"
        />
        <el-button 
          type="primary" 
          :loading="chatStore.isGenerating" 
          :disabled="!userInput.trim()"
          @click="handleSend"
          class="send-btn"
        >
          发送 <el-icon class="el-icon--right"><Position /></el-icon>
        </el-button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '../stores/chatStore'
import { useSSE } from '../composables/useSSE'
import MarkdownView from '../components/chat/MarkdownView.vue'
import TraceTimeline from '../components/chat/TraceTimeline.vue'
import { Loading, Position, Delete } from '@element-plus/icons-vue'

const chatStore = useChatStore()
const { sendMessage } = useSSE()

const userInput = ref('')
const scrollbarRef = ref(null)

// 处理回车发送与 Shift+Enter 换行
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault() // 阻止默认的回车换行行为
    handleSend()
  }
}

const handleSend = () => {
  if (!userInput.value.trim() || chatStore.isGenerating) return
  sendMessage(userInput.value)
  userInput.value = ''
}

// 自动滚动到底部逻辑 (适配 el-scrollbar)
watch(
  () => chatStore.messages,
  async () => {
    await nextTick()
    if (scrollbarRef.value) {
      // 获取 scrollbar 内部的滚动容器，并滚动到底部
      const wrap = scrollbarRef.value.wrapRef
      if (wrap) {
        wrap.scrollTop = wrap.scrollHeight
      }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8fafc;
}

.chat-header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-left h2 { margin: 0; font-size: 20px; color: #1e293b; }

.chat-main {
  flex: 1;
  background: #f8fafc;
}

.message-list {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px; /* 限制最大宽度，提升大屏阅读体验 */
  margin: 0 auto;
}

.message-row {
  display: flex;
  gap: 16px;
  max-width: 90%;
}

.user-row {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-row {
  align-self: flex-start;
}

.bubble {
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  line-height: 1.6;
  font-size: 15px;
}

.user-row .bubble {
  background-color: #ecf5ff; /* Element Plus 的浅蓝色 */
  color: #409eff;
  border-top-right-radius: 2px;
  border: 1px solid #d9ecff;
}

.ai-row .bubble {
  background-color: white;
  border-top-left-radius: 2px;
  border: 1px solid #e2e8f0;
  min-width: 200px;
}

.chat-footer {
  padding: 20px 24px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.input-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end; /* 让按钮和输入框底部对齐 */
  gap: 16px;
}

/* 穿透修改 Element Plus 内部样式，去掉难看的边框，使其融入极客风格 */
:deep(.custom-el-input .el-textarea__inner) {
  background-color: #f1f5f9;
  border: none;
  box-shadow: none !important;
  font-size: 15px;
  padding: 12px 16px;
  border-radius: 12px;
}

:deep(.custom-el-input .el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #409eff !important;
}

.send-btn {
  height: 46px; /* 固定按钮高度 */
  padding: 0 24px;
  border-radius: 12px;
  font-weight: bold;
}
</style>