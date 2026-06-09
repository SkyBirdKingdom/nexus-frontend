<template>
  <div class="sidebar-container">
    <div class="sidebar-header">
      <el-button type="primary" class="new-chat-btn" @click="chatStore.createNewChat" :disabled="chatStore.isGenerating">
        <el-icon><Plus /></el-icon> 新建 RAG 对话
      </el-button>
    </div>

    <div class="sidebar-footer" @click="kbDialogVisible = true">
      <el-avatar :size="32" style="background: #3b82f6;">U</el-avatar>
      <div class="user-info">
        <span class="user-name">Nexus Admin</span>
        <span class="user-role">📚 数据连接器中心</span>
      </div>
      <el-icon class="settings-icon"><Setting /></el-icon>
    </div>

    <el-dialog
      v-model="kbDialogVisible"
      title="Nexus 多模态数据摄取中心 (Ingestion)"
      width="700px"
      destroy-on-close
      class="dark-dialog custom-connector-dialog"
    >
      <el-tabs tab-position="left" class="connector-tabs">
        
        <el-tab-pane>
          <template #label><span class="tab-label">📁 本地文档</span></template>
          <div class="connector-panel">
            <h3>上传本地文件</h3>
            <p class="panel-desc">支持 PDF, Word, Excel, PPT 等格式。PDF 将由 VLM 解析视觉元素，Office 文件由 MarkItDown 转换为 Markdown。</p>
            <el-upload
              class="upload-demo" drag multiple
              action="http://localhost:8000/api/v1/documents/upload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              accept=".pdf,.docx,.xlsx,.pptx,.csv,.md"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
            </el-upload>
          </div>
        </el-tab-pane>

        <el-tab-pane>
          <template #label><span class="tab-label">🕊️ 飞书文档</span></template>
          <div class="connector-panel">
            <h3>绑定飞书云文档 (Lark)</h3>
            <p class="panel-desc">配置企业自建应用凭证，通过定时任务 (Cron) 自动同步指定云文档目录内容。</p>
            <el-form label-position="top">
              <el-form-item label="App ID"><el-input placeholder="cli_a4b3..." /></el-form-item>
              <el-form-item label="App Secret"><el-input placeholder="输入应用密钥" type="password" show-password /></el-form-item>
              <el-form-item label="根目录 Folder Token"><el-input placeholder="fldcn..." /></el-form-item>
              <el-button type="primary" class="full-width-btn">建立飞书连接 (WebHook)</el-button>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane>
          <template #label><span class="tab-label">📘 Confluence</span></template>
          <div class="connector-panel">
            <h3>接入 Confluence 知识库</h3>
            <p class="panel-desc">输入 Space 标识，后台 Airbyte 引擎将抓取页面并保持增量更新。</p>
            <el-form label-position="top">
              <el-form-item label="Base URL"><el-input placeholder="https://your-domain.atlassian.net/wiki" /></el-form-item>
              <el-form-item label="Space Key"><el-input placeholder="例如: ENG, HR, ARCH" /></el-form-item>
              <el-form-item label="API Token"><el-input placeholder="Atlassian Personal Access Token" type="password" show-password /></el-form-item>
              <el-button type="primary" class="full-width-btn">开始全量同步</el-button>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane>
          <template #label><span class="tab-label">🛠️ Jira 缺陷跟踪</span></template>
          <div class="connector-panel">
            <h3>接入 Jira Issue</h3>
            <p class="panel-desc">让大模型学习历史 Bug 修复方案，遇到报错时可直接检索内部经验。</p>
            <el-form label-position="top">
              <el-form-item label="Project Key"><el-input placeholder="例如: NEXUS, PLATFORM" /></el-form-item>
              <el-form-item label="JQL 过滤条件 (可选)"><el-input placeholder="status = Done AND resolution = Fixed" /></el-form-item>
              <el-button type="primary" class="full-width-btn">同步 Issue 数据</el-button>
            </el-form>
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

:deep(.custom-connector-dialog .el-dialog__body) {
  padding: 0; /* 移除默认 padding，让 tabs 撑满 */
}

.connector-tabs {
  height: 450px;
}

:deep(.el-tabs--left .el-tabs__header.is-left) {
  margin-right: 0;
  background-color: #f8fafc;
  width: 160px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.connector-panel {
  padding: 24px;
  height: 450px;
  box-sizing: border-box;
  overflow-y: auto;
}

.connector-panel h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #1e293b;
}

.panel-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
}

.full-width-btn {
  width: 100%;
  margin-top: 12px;
}
</style>