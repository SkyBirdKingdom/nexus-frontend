<template>
  <div class="sidebar-container">
    <div class="sidebar-header">
      <el-button color="#ffffff" class="new-chat-btn" @click="chatStore.createNewChat" :disabled="chatStore.isGenerating">
        <el-icon><Plus /></el-icon> 开启新终端 (New Chat)
      </el-button>
    </div>

    <div class="history-list">
      <div class="list-title">知识探索链路</div>
      <el-scrollbar>
        <div 
          v-for="session in chatStore.sessionList" 
          :key="session.id"
          :class="['session-item', { active: chatStore.threadId === session.id }]"
          @click="chatStore.switchChat(session.id)"
        >
          <el-icon class="session-icon"><ChatDotRound /></el-icon>
          <div class="session-info">
            <span class="session-title">{{ session.title }}</span>
            <span class="session-date">{{ session.date }}</span>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="sidebar-footer" @click="kbDialogVisible = true">
      <div class="user-avatar-glow">A</div>
      <div class="user-info">
        <span class="user-name">Nexus Admin</span>
        <span class="user-role">数据中枢 (Ingestion)</span>
      </div>
      <el-icon class="settings-icon"><Setting /></el-icon>
    </div>

    <el-dialog v-model="kbDialogVisible" title="Nexus 多模态数据摄取中心" width="700px" destroy-on-close class="studio-dialog custom-connector-dialog">
       <el-tabs tab-position="left" class="connector-tabs">
        <el-tab-pane>
          <template #label><span class="tab-label">📁 本地文档</span></template>
          <div class="connector-panel">
            <h3>上传本地文件</h3>
            <p class="panel-desc">支持 PDF, Word, Excel 等格式进行深度 RAG 解析。</p>
            <el-upload class="upload-demo" drag multiple action="http://localhost:8000/api/v1/documents/upload" accept=".pdf,.docx,.xlsx,.csv,.md">
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
            </el-upload>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '../../stores/chatStore'
import { Plus, ChatDotRound, Setting, UploadFilled } from '@element-plus/icons-vue'

const chatStore = useChatStore()
const kbDialogVisible = ref(false)
</script>

<style scoped>
/* 🚀 专属品牌：深邃宇宙黑侧边栏 */
.sidebar-container { 
  width: 280px; height: 100vh; background-color: #020617; /* 极致的深蓝黑 */
  display: flex; flex-direction: column; color: #f8fafc; flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.05);
}

.sidebar-header { padding: 24px 20px; }
.new-chat-btn { 
  width: 100%; height: 44px; border-radius: 12px; font-size: 14px; font-weight: 600; 
  justify-content: flex-start; padding-left: 20px; color: #0f172a;
  box-shadow: 0 4px 12px rgba(255,255,255,0.1); border: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.new-chat-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(255,255,255,0.2); }

/* 历史记录列表 */
.history-list { flex: 1; overflow: hidden; display: flex; flex-direction: column; padding: 0 12px; }
.list-title { padding: 0 12px 12px; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

.session-item { 
  display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 4px;
  cursor: pointer; border-radius: 10px; color: #94a3b8; transition: all 0.2s;
}
.session-item:hover { background-color: rgba(255,255,255,0.05); color: #f8fafc; }
.session-item.active { background-color: rgba(56, 189, 248, 0.1); color: #38bdf8; }

.session-icon { font-size: 16px; opacity: 0.8; }
.session-info { display: flex; flex-direction: column; overflow: hidden; }
.session-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.session-date { font-size: 11px; color: #475569; margin-top: 4px; }

/* 底部中枢 */
.sidebar-footer { 
  padding: 20px; margin: 12px; border-radius: 12px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s;
}
.sidebar-footer:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }

.user-avatar-glow {
  width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #38bdf8, #8b5cf6);
  color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 14px;
}
.user-info { display: flex; flex-direction: column; flex: 1; }
.user-name { font-size: 13px; font-weight: 600; color: #f8fafc; }
.user-role { font-size: 11px; color: #64748b; margin-top: 2px;}
.settings-icon { color: #64748b; }

</style>

<style>
/* ==========================================
   🚨 全局挂载：Nexus 专属深空科技风 Dialog 样式
   由于 el-dialog 挂载在 body 下，必须使用非 scoped 样式拦截
   ========================================== */
/* 弹窗主体容器：极净白 + 柔和的弥散阴影 */
.studio-dialog.el-dialog {
  background-color: #ffffff !important;
  border-radius: 16px;
  border: 1px solid #e4e4e7;
  /* 极其昂贵的阴影质感，只有大厂才会这么配参数 */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02) !important;
  overflow: hidden;
}

/* 弹窗标题栏 */
.studio-dialog .el-dialog__header {
  border-bottom: 1px solid #f4f4f5;
  margin-right: 0;
  padding: 20px 24px;
  background: #ffffff;
}
.studio-dialog .el-dialog__title {
  color: #18181b;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.2px;
}
.studio-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #a1a1aa;
  font-size: 18px;
  transition: color 0.2s;
}
.studio-dialog .el-dialog__headerbtn:hover .el-dialog__close { color: #18181b; }

/* 左侧 Tabs 导航区：浅灰底色作为视觉层级分割 */
.studio-dialog .el-tabs--left .el-tabs__header.is-left {
  background-color: #fafafa;
  border-right: 1px solid #f4f4f5;
  margin-right: 0;
  width: 160px;
}
.studio-dialog .el-tabs__item {
  color: #71717a;
  font-weight: 500;
  font-size: 13.5px;
  transition: all 0.2s;
  justify-content: flex-start;
  padding-left: 20px !important;
}
.studio-dialog .el-tabs__item:hover { color: #18181b; background: #f4f4f5; }
.studio-dialog .el-tabs__item.is-active {
  color: #2563eb; /* 核心品牌学术蓝 */
  background-color: #ffffff;
  font-weight: 600;
}
/* 取消默认的蓝色下划线，改用左侧或完全隐藏 */
.studio-dialog .el-tabs__active-bar { display: none; }

/* 右侧内容面板 */
.studio-dialog .connector-panel {
  background-color: #ffffff;
  padding: 28px 36px;
}
.studio-dialog .connector-panel h3 { 
  color: #18181b; 
  font-weight: 600; 
  font-size: 15px; 
  margin-bottom: 6px; 
}
.studio-dialog .panel-desc { 
  color: #71717a; 
  font-size: 13.5px; 
  line-height: 1.6;
}

/* 拖拽上传组件精细化定制 */
.studio-dialog .el-upload-dragger {
  background-color: #fafafa;
  border: 1px dashed #e4e4e7;
  border-radius: 12px;
  padding: 40px 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.studio-dialog .el-upload-dragger:hover {
  border-color: #2563eb;
  background-color: #eff6ff; /* 极浅的焦点蓝 */
}
.studio-dialog .el-upload__text { color: #71717a; font-size: 13.5px; margin-top: 12px; }
.studio-dialog .el-upload__text em { color: #2563eb; font-weight: 600; font-style: normal; }
.studio-dialog .el-icon--upload { color: #a1a1aa; font-size: 48px; transition: color 0.2s; }
.studio-dialog .el-upload-dragger:hover .el-icon--upload { color: #2563eb; }

/* 表单输入框极简适配 */
.studio-dialog .el-form-item__label { color: #3f3f46; font-weight: 500; padding-bottom: 4px; }
.studio-dialog .el-input__wrapper {
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #e4e4e7 inset;
  border-radius: 8px;
  padding: 4px 12px;
  transition: all 0.2s;
}
.studio-dialog .el-input__wrapper:hover { box-shadow: 0 0 0 1px #d4d4d8 inset; }
.studio-dialog .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #2563eb inset !important;
  background-color: #ffffff;
}
.studio-dialog .el-input__inner { color: #18181b; }
.studio-dialog .el-input__inner::placeholder { color: #a1a1aa; }

/* 按钮高级质感：纯黑克制风 */
.studio-dialog .el-button--primary {
  background: #18181b;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  color: #ffffff;
  height: 38px;
  transition: all 0.2s;
}
.studio-dialog .el-button--primary:hover {
  background: #27272a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
</style>