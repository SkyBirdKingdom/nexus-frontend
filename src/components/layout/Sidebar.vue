<template>
  <div class="sidebar-container">
    <div class="sidebar-header">
      <el-button type="primary" class="new-chat-btn" @click="chatStore.createNewChat" :disabled="chatStore.isGenerating">
        <el-icon><Plus /></el-icon> 新建 RAG 对话
      </el-button>
    </div>

    <div class="history-list">
      <div class="list-title">最近的探索</div>
      <el-scrollbar>
        <div 
          v-for="session in chatStore.sessionList" 
          :key="session.id"
          :class="['session-item', chatStore.threadId === session.id ? 'active' : '']"
          @click="chatStore.switchChat(session.id)"
        >
          <el-icon><ChatDotRound /></el-icon>
          <div class="session-info">
            <span class="session-title">{{ session.title }}</span>
            <span class="session-date">{{ session.date }}</span>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="sidebar-footer" @click="kbDialogVisible = true">
      <el-avatar :size="32" style="background: #3b82f6;">U</el-avatar>
      <div class="user-info">
        <span class="user-name">Nexus Admin</span>
        <span class="user-role">📚 知识库管理中心</span>
      </div>
      <el-icon class="settings-icon"><Setting /></el-icon>
    </div>

    <el-dialog
      v-model="kbDialogVisible"
      title="Nexus 多模态知识库管理"
      width="500px"
      destroy-on-close
      class="dark-dialog"
    >
      <div class="kb-desc">
        上传企业 PDF 文档，后台 VLM 引擎（Qwen2.5-VL）将自动提取图表、解析网络拓扑并进行向量化。
      </div>
      
      <el-upload
        class="upload-demo"
        drag
        action="http://localhost:8000/api/v1/documents/upload"
        multiple
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        accept=".pdf"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将 PDF 拖到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip text-center">
            ⚠️ VLM 解析含有大量图片的 PDF 可能会消耗较长时间，请耐心等待后台处理。
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '../../stores/chatStore'
import { Plus, ChatDotRound, Setting, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const chatStore = useChatStore()
const kbDialogVisible = ref(false) // 控制弹窗显示

// 上传成功的回调
const handleUploadSuccess = (response) => {
  if (response.code === 200) {
    ElMessage({
      message: response.message,
      type: 'success',
      duration: 5000 // 提示框多留一会儿，让用户看完文字
    })
  } else {
    ElMessage.error(response.message || '上传处理异常')
  }
}

// 上传失败的回调
const handleUploadError = () => {
  ElMessage.error('网络错误或服务器无响应，请检查后端状态。')
}
</script>

<style scoped>
/* 原有侧边栏样式保留... */
.sidebar-container { width: 260px; height: 100vh; background-color: #171717; display: flex; flex-direction: column; color: #e5e5e5; border-right: 1px solid #262626; flex-shrink: 0; }
.sidebar-header { padding: 20px; }
.new-chat-btn { width: 100%; height: 44px; border-radius: 8px; font-size: 15px; font-weight: 600; justify-content: flex-start; padding-left: 20px; background-color: #262626; border: 1px solid #404040; color: #fff; transition: all 0.2s; }
.new-chat-btn:hover { background-color: #3b82f6; border-color: #3b82f6; }
.history-list { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.list-title { padding: 0 20px 10px; font-size: 12px; color: #737373; font-weight: 600; }
.session-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; cursor: pointer; transition: background 0.2s; color: #a3a3a3; }
.session-item:hover, .session-item.active { background-color: #262626; color: #fff; }
.session-item.active { border-left: 3px solid #3b82f6; }
.session-info { display: flex; flex-direction: column; overflow: hidden; }
.session-title { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.session-date { font-size: 11px; color: #737373; margin-top: 2px; }

/* 🚀 升级底部交互样式 */
.sidebar-footer { 
  padding: 20px; 
  border-top: 1px solid #262626; 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  cursor: pointer;
  transition: background 0.2s;
}
.sidebar-footer:hover { background-color: #262626; }
.user-info { display: flex; flex-direction: column; flex: 1; }
.user-name { font-size: 14px; font-weight: 600; }
.user-role { font-size: 11px; color: #3b82f6; font-weight: 600; margin-top: 2px;}
.settings-icon { color: #737373; font-size: 18px; }

/* 弹窗内部样式 */
.kb-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.5;
  padding: 12px;
  background-color: #f1f5f9;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}
.text-center { text-align: center; margin-top: 8px; color: #eab308; }
</style>