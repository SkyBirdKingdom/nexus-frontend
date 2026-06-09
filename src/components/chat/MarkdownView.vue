<template>
  <div class="markdown-container">
    <div class="markdown-body" v-html="finalHtml" @click="handleBodyClick"></div>

    <div v-if="sources && sources.length > 0" class="citation-footer">
      <div class="citation-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg> 
        情报溯源网络
      </div>
      <ol>
        <li v-for="source in sources" :key="source.id" class="cite-ref-item" @click="openSourceDialog(source)">
          <span class="ref-id">[{{ source.id }}]</span> 
          <span class="ref-title">{{ source.title }}</span>
        </li>
      </ol>
    </div>

    <el-dialog v-model="dialogVisible" title="📄 原始底层情报解析" width="650px" append-to-body class="source-dialog">
      <template v-if="activeSource">
        <div class="source-meta-header">
          <div class="meta-badge">检索链路</div>
          <div class="meta-text">{{ activeSource.title }}</div>
        </div>
        <div class="source-chunk-container">
          <div class="chunk-title">知识库原生 Chunk</div>
          <div class="chunk-content">{{ activeSource.chunk }}</div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css' 
import { useClipboard } from '@vueuse/core'

const props = defineProps({
  content: { type: String, required: true },
  sources: { type: Array, default: () => [] }
})

const { copy } = useClipboard()
const dialogVisible = ref(false)
const activeSource = ref(null)

// Markdown 解析器配置
const renderer = new marked.Renderer()

renderer.code = (codeArg, infostring, escaped) => {
  // ==========================================
  // 🚀 核心修复 1：动态抹平 Marked.js 的版本差异
  // 兼容新版 marked (传入 Token 对象) 和旧版 (传入 string)
  // ==========================================
  const code = typeof codeArg === 'object' ? (codeArg.text || '') : (codeArg || '');
  const language = typeof codeArg === 'object' ? (codeArg.lang || '') : (infostring || '');

  // ==========================================
  // 🚀 核心修复 2：Artifact 嗅探器
  // ==========================================
  const isArtifact = language?.includes('nexus-artifact') || code.includes("<div class='table-wrapper'>");

  if (isArtifact) {
    // 精准判断闭合状态：只有当大模型完整输出了 </table> 并且以 </div> 结尾时，才算真正完成
    const isComplete = code.includes('</table>') && code.trim().endsWith('</div>');
    
    // 状态 1：正在流式接收中 -> 展示极具科技感的骨架屏，绝不渲染半成品 HTML！
    if (!isComplete) {
      return `
        <div class="nexus-artifact-loading">
          <div class="cyber-scanner"></div>
          <div class="loading-content">
             <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>
             <span>🧬 Nexus 引擎正在编译高维数据矩阵，请稍后...</span>
          </div>
        </div>
      `;
    }
    
    // 状态 2：接收完毕 -> 瞬间释放完美的 HTML DOM
    return `<div class="nexus-artifact-ready">${code}</div>`;
  }

  // 其他普通代码块的高亮逻辑保持不变
  const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(code, { language: validLanguage }).value;
  return `<div class="code-block-wrapper"><pre><code class="hljs ${validLanguage}">${highlighted}</code></pre></div>`;
}

marked.setOptions({ renderer, breaks: true, gfm: true })

// 轻量级正文解析
const finalHtml = computed(() => {
  let text = props.content || ''
  
  // 1. 过滤冗余附录
  text = text.replace(/^\[\^\d+\]:.*$/gm, '').replace(/(###|\*\*)\s*(参考来源|参考文献|引用依据).*\n?/g, '')

  // 🚨🚨🚨 核心修复 3：【彻底删除了旧的 DOM 缝合逻辑 (openTable...)】 🚨🚨🚨
  // 因为 HTML 现在被关在 Markdown 代码块的“笼子”里，
  // 渲染器会自动用 Artifact Loading 状态拦截它，不再需要我们手动去补全标签了！
  // 删掉旧代码，直接消灭了 '<' 闪烁的元凶！

  // 2. 脚注处理
  text = text.replace(/\[\^(\d+)\]/g, (match, id) => {
    const source = props.sources.find(s => s.id === id)
    return `<sup class="citation-node" data-id="${id}" title="${source?.title || '引用'}">[${id}]</sup>`
  })

  return marked.parse(text)
})

// 弹窗与事件逻辑
const openSourceDialog = (source) => { activeSource.value = source; dialogVisible.value = true }
const handleBodyClick = async (e) => {
  if (e.target.closest('.copy-btn')) {
    const code = decodeURIComponent(e.target.closest('.copy-btn').getAttribute('data-code'))
    await copy(code)
  }
  if (e.target.closest('.citation-node')) {
    const id = e.target.closest('.citation-node').getAttribute('data-id')
    openSourceDialog(props.sources.find(s => s.id === id))
  }
}
</script>

<style scoped>
.markdown-body { color: #334155; line-height: 1.7; font-size: 15px; }

/* ==========================================
   现代扁平化科技风表格 (Fluent Design)
   ========================================== */
:deep(.table-wrapper) {
  margin: 20px 0;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  background: white;
}
:deep(table) {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 必须：防止流式输出闪烁 */
}
:deep(th) {
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #cbd5e1;
}
:deep(td) {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
  vertical-align: middle;
}
:deep(tr:hover) { background: #f8fafc; }

/* 引用样式 */
.citation-node {
  cursor: pointer; color: #2563eb; font-weight: bold; padding: 0 2px;
}
.citation-footer { margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px; font-size: 13px; }
.citation-title { display: flex; align-items: center; gap: 6px; font-weight: 600; margin-bottom: 8px; }
.cite-ref-item { padding: 4px; cursor: pointer; border-radius: 4px; }
.cite-ref-item:hover { background: #e2e8f0; }

/* ==========================================
   Nexus Artifact 动态编译状态 (科技感拉满)
   ========================================== */
.nexus-artifact-loading {
  position: relative;
  margin: 1.5rem 0;
  padding: 2rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
}

/* 赛博朋克扫描线动画 */
.cyber-scanner {
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(to right, transparent, #38bdf8, transparent);
  box-shadow: 0 0 10px #38bdf8;
  animation: scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes scan {
  0% { transform: translateY(-10px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(100px); opacity: 0; }
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #38bdf8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.spin-icon { width: 20px; height: 20px; animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ==========================================
   Nexus Artifact 动态编译状态 (科技感拉满)
   ========================================== */
/* 🚨 核心修复：所有的动态注入类名必须加上 :deep() 才能生效 */
:deep(.nexus-artifact-loading) {
  position: relative;
  margin: 1.5rem 0;
  padding: 2rem;
  background-color: #0f172a; /* 深邃宇宙蓝底色 */
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.1);
}

/* 赛博朋克扫描线动画 */
:deep(.cyber-scanner) {
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(to right, transparent, #38bdf8, transparent);
  box-shadow: 0 0 10px #38bdf8;
  animation: scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes scan {
  0% { transform: translateY(-10px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(100px); opacity: 0; }
}

:deep(.loading-content) {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #38bdf8; /* 科技蓝荧光字 */
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  z-index: 1; /* 确保文字不被扫描线覆盖 */
}

/* 🚨 强制限制 SVG 图标大小，防止被全局样式撑爆 */
:deep(.spin-icon) {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px;
  animation: spin 2s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ==========================================
   Nexus 编译完成：高维数据矩阵 (Fluent x Cyber 融合风)
   ========================================== */

:deep(.nexus-artifact-ready .nexus-table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1.5rem 0;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

:deep(.nexus-artifact-ready th) {
  background: #f8fafc;
  color: #0f172a;
  font-weight: 600;
  text-align: left;
  padding: 14px 16px;
  border-bottom: 2px solid #e2e8f0;
  border-right: 1px solid #f1f5f9;
}

:deep(.nexus-artifact-ready td) {
  padding: 12px 16px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  vertical-align: middle;
  line-height: 1.6;
}

:deep(.nexus-artifact-ready tr:hover td) {
  background-color: #f0f9ff;
  transition: all 0.2s ease;
}
</style>