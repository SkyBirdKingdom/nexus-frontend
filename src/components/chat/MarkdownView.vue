<template>
  <div class="markdown-container">
    <div class="markdown-body" v-html="finalHtml" @click="handleBodyClick"></div>

    <div v-if="sources && sources.length > 0" class="citation-footer">
      <div class="citation-title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg> 
        情报溯源网络
      </div>
      <ol class="citation-list">
        <li v-for="source in sources" :key="source.id" class="cite-ref-item" @click="openSourceDialog(source)">
          <span class="ref-id">[{{ source.id }}]</span> 
          <span class="ref-title">{{ source.title }}</span>
        </li>
      </ol>
    </div>

    <el-dialog v-model="dialogVisible" title="📄 原始底层情报解析" width="620px" append-to-body class="source-dialog">
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

const renderer = new marked.Renderer()

// 🚨 核心拦截器：大厂 Artifacts 协议
renderer.code = (codeArg, infostring) => {
  const code = typeof codeArg === 'object' ? (codeArg.text || '') : (codeArg || '');
  const language = typeof codeArg === 'object' ? (codeArg.lang || '') : (infostring || '');

  const isArtifact = language?.includes('nexus-artifact') || code.includes("<div class='table-wrapper'>");

  if (isArtifact) {
    const isComplete = code.includes('</table>') && code.trim().endsWith('</div>');
    
    // 状态 1：正在编译中 -> 极其克制、高级的 Fluent 浅色小骨架屏，绝不撑爆屏幕
    if (!isComplete) {
      return `
        <div class="nexus-artifact-loading">
          <div class="loading-content-core">
             <svg class="spin-icon-fixed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>
             <span>🧬 Nexus 引擎正在编译高维数据矩阵...</span>
          </div>
        </div>
      `;
    }
    
    // 状态 2：接收完毕 -> 瞬间释放，无缝契合
    return `<div class="nexus-artifact-ready">${code}</div>`;
  }

  const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(code, { language: validLanguage }).value;
  return `<div class="code-block-wrapper"><pre><code class="hljs ${validLanguage}">${highlighted}</code></pre></div>`;
}

marked.setOptions({ renderer, breaks: true, gfm: true })

const finalHtml = computed(() => {
  let text = props.content || ''
  text = text.replace(/^\[\^\d+\]:.*$/gm, '').replace(/(###|\*\*)\s*(参考来源|参考文献|引用依据).*\n?/g, '')
  text = text.replace(/\[\^(\d+)\]/g, (match, id) => {
    return `<sup class="citation-node" data-id="${id}">[${id}]</sup>`
  })
  return marked.parse(text)
})

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
/* 大厂级精细正文排版 */
.markdown-body { 
  color: #18181b; 
  line-height: 1.75; 
  font-size: 14.5px; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.markdown-body :deep(p) { margin-bottom: 14px; }

/* ==========================================
   🚨 终极降维打击：绝对防抖大厂表格样式
   ========================================== */
:deep(.table-wrapper) {
  margin: 18px 0;
  border-radius: 10px;
  border: 1px solid #e4e4e7;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

:deep(table) {
  width: 100% !important;
  max-width: 100% !important;
  border-collapse: collapse !important;
  /* 🚨 锁死物理网格：不论文字怎么流式变动，浏览器绝对不允许重新计算列宽！ */
  table-layout: fixed !important; 
}

:deep(th) {
  background: #f8fafc;
  color: #52525b;
  font-weight: 600;
  padding: 11px 14px;
  text-align: left;
  font-size: 13.5px;
  border-bottom: 1px solid #e4e4e7;
  border-right: 1px solid #f4f4f5;
}

:deep(td) {
  padding: 11px 14px;
  border-bottom: 1px solid #f4f4f5;
  border-right: 1px solid #f4f4f5;
  color: #27272a;
  font-size: 13.5px;
  vertical-align: middle;
  /* 🚨 配合固定列宽，防止超长字符把网格挤变形 */
  word-wrap: break-word !important;
  word-break: break-all !important;
}

:deep(tr:last-child td) { border-bottom: none; }
:deep(tr:hover td) { background: #fafafa; }

/* ==========================================
   高精度 Artifact 编译状态 (精细浅色微光风)
   ========================================== */
:deep(.nexus-artifact-loading) {
  margin: 16px 0;
  padding: 16px 20px;
  background-color: #f8fafc; /* 优雅的灰蓝微光底色 */
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

:deep(.loading-content-core) {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2563eb; /* 经典学术蓝 */
  font-size: 13.5px;
  font-weight: 500;
}

/* 🚨 通过强特异性与 !important，彻底粉碎全局大图污染 */
:deep(.nexus-artifact-loading .spin-icon-fixed) {
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  color: #2563eb !important;
  animation: spinCore 1.5s linear infinite !important;
}
@keyframes spinCore { 100% { transform: rotate(360deg); } }

:deep(.nexus-artifact-ready) {
  display: block;
}

/* ==========================================
   学术级文献溯源网络
   ========================================== */
.citation-node {
  cursor: pointer;
  color: #2563eb;
  font-weight: 600;
  font-size: 11px;
  padding: 0 3px;
  vertical-align: super;
}
.citation-node:hover { text-decoration: underline; }

.citation-footer {
  margin-top: 2.5rem;
  padding: 16px 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
}
.citation-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 12px;
}
.citation-list { padding-left: 14px; margin: 0; color: #64748b; }
.cite-ref-item {
  margin-bottom: 6px;
  cursor: pointer;
  transition: color 0.2s;
}
.cite-ref-item:hover { color: #2563eb; text-decoration: underline; }
.ref-id { font-weight: 600; color: #2563eb; margin-right: 6px; }
</style>