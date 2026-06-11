<template>
  <div class="chat-container">
    <div class="studio-pure-bg"></div>

    <header class="chat-header">
      <div class="header-left">
        <h2>Nexus <span class="brand-text">Engine</span></h2>
        <el-tag type="info" effect="dark" round size="small" class="status-tag">
          <span class="pulse-dot"></span> M4 Pro Node Active
        </el-tag>
      </div>
      <div class="header-right">
        <el-button class="clear-btn" plain size="small" @click="chatStore.createNewChat">
          <el-icon><Delete /></el-icon> 清空会话
        </el-button>
      </div>
    </header>

    <el-scrollbar ref="scrollbarRef" class="chat-main" always @scroll="handleScroll">
      <div class="message-list">
        <div 
          v-for="(msg, index) in chatStore.messages" 
          :key="index"
          :class="['message-row', msg.role === 'user' ? 'user-row' : 'ai-row']"
        >
          <div class="avatar-col" v-if="msg.role !== 'user'">
            <div class="ai-avatar-core">N</div>
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

          <div class="avatar-col" v-if="msg.role === 'user'">
            <div class="user-avatar-core">
              {{ authStore.currentUser?.username?.charAt(0).toUpperCase() || 'U' }}
            </div>
          </div>

        </div>
      </div>
    </el-scrollbar>

    <footer class="chat-footer">
      <div class="input-wrapper studio-input-area">
        <el-input
          v-model="userInput"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 6 }"
          placeholder="向 Nexus 智能体中枢提问..."
          @keydown="handleKeydown"
          :disabled="chatStore.isGenerating"
          resize="none"
          class="custom-el-input"
        />
        <el-button 
          color="#18181b"
          :loading="chatStore.isGenerating" 
          :disabled="!userInput.trim()"
          @click="handleSend"
          class="send-btn"
          :icon="Position"
          circle
        >
        </el-button>
      </div>
      <div class="footer-copy">Nexus Agentic RAG Platform • Professional Data Grid Engine</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore' // 🚨 引入鉴权库
import { useSSE } from '../composables/useSSE'
import MarkdownView from '../components/chat/MarkdownView.vue'
import TraceTimeline from '../components/chat/TraceTimeline.vue'
import { Position, Delete } from '@element-plus/icons-vue'

const chatStore = useChatStore()
const authStore = useAuthStore() // 🚨 初始化
const { sendMessage } = useSSE()

const userInput = ref('')
const scrollbarRef = ref(null)
const isAutoScrolling = ref(true)

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  if (!userInput.value.trim() || chatStore.isGenerating) return
  isAutoScrolling.value = true
  sendMessage(userInput.value)
  userInput.value = ''
}

const handleScroll = ({ scrollTop }) => {
  const wrap = scrollbarRef.value?.wrapRef
  if (wrap) {
    const distanceToBottom = wrap.scrollHeight - scrollTop - wrap.clientHeight
    isAutoScrolling.value = distanceToBottom <= 40
  }
}

watch(
  () => chatStore.messages,
  async () => {
    await nextTick()
    if (isAutoScrolling.value && scrollbarRef.value) {
      const wrap = scrollbarRef.value.wrapRef
      if (wrap) wrap.scrollTop = wrap.scrollHeight
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
  position: relative;
  background-color: #fcfcfd;
  overflow: hidden;
}

.studio-pure-bg {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  z-index: 0; pointer-events: none;
  background: radial-gradient(at 50% 0%, #f4f4f5 0%, #fcfcfd 100%);
}

.chat-header {
  padding: 14px 32px; background: #ffffff; border-bottom: 1px solid #efeff1;
  display: flex; justify-content: space-between; align-items: center; z-index: 10;
}

.header-left h2 { margin: 0; font-size: 18px; color: #18181b; font-weight: 700; letter-spacing: -0.3px; }
.brand-text { background: linear-gradient(135deg, #2563eb, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.status-tag { background: #18181b; border: none; display: flex; align-items: center; gap: 6px; font-weight: 500; }
.pulse-dot { width: 6px; height: 6px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 6px #10b981; }

.clear-btn { background: #ffffff; border: 1px solid #e4e4e7; color: #71717a; border-radius: 8px; font-weight: 500; }
.clear-btn:hover { background: #f4f4f5; color: #e11d48; border-color: #f4f4f5; }

.chat-main { flex: 1; z-index: 1; }
.message-list { padding: 40px 24px; display: flex; flex-direction: column; gap: 32px; max-width: 840px; margin: 0 auto; }
.message-row { display: flex; gap: 16px; width: 100%; }
.user-row { justify-content: flex-end; }
.ai-row { justify-content: flex-start; }

.avatar-col { flex-shrink: 0; }

/* AI 品牌头像 */
.ai-avatar-core {
  width: 32px; height: 32px; border-radius: 8px;
  background: #18181b; color: #ffffff;
  display: flex; justify-content: center; align-items: center;
  font-weight: 700; font-family: monospace; font-size: 14px;
}

/* 🚨 新增：大厂极简冷灰风用户头像 */
.user-avatar-core {
  width: 32px; height: 32px; border-radius: 8px;
  background: #f4f4f5; color: #18181b;
  display: flex; justify-content: center; align-items: center;
  font-weight: 700; font-family: monospace; font-size: 14px;
  border: 1px solid #e4e4e7;
}

.bubble { max-width: 100%; }

.user-row .bubble {
  background-color: #f4f4f5; color: #18181b; padding: 12px 18px;
  border-radius: 14px; font-size: 14.5px; font-weight: 400;
  border: 1px solid #e4e4e7; max-width: 75%;
}

.ai-row .bubble {
  background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px;
  padding: 24px; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  width: 100%;
}

.chat-footer { padding: 0 24px 20px 24px; background: transparent; z-index: 10; }

.studio-input-area {
  max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 18px;
  padding: 8px 10px 8px 18px; display: flex; align-items: flex-end; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.04);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.studio-input-area:focus-within { border-color: #a1a1aa; box-shadow: 0 8px 32px -4px rgba(0,0,0,0.08); }

:deep(.custom-el-input .el-textarea__inner) {
  background-color: transparent; border: none; box-shadow: none !important;
  font-size: 14.5px; padding: 8px 0; color: #18181b; resize: none; line-height: 1.5;
}
:deep(.custom-el-input .el-textarea__inner::placeholder) { color: #a1a1aa; }

.send-btn { width: 34px; height: 34px; flex-shrink: 0; margin-bottom: 2px; border: none; }
.footer-copy { text-align: center; font-size: 11px; color: #a1a1aa; margin-top: 10px; font-weight: 500; }
</style>