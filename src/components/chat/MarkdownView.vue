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

    <el-dialog v-model="dialogVisible" title="📄 原始底层情报解析" width="650px" append-to-body class="source-dialog">
      <template v-if="activeSource">
        <div class="source-meta-header">
          <div class="meta-badge">检索链路</div>
          <div class="meta-text">{{ activeSource.title }}</div>
        </div>
        
        <div class="score-metrics" v-if="activeSource.rerank_score || activeSource.rrf_score">
          <div class="metric-item" v-if="activeSource.rerank_score">
            <span class="metric-label">Rerank 精度:</span>
            <span class="metric-value">{{ activeSource.rerank_score }}</span>
          </div>
          <div class="metric-item" v-if="activeSource.rrf_score">
            <span class="metric-label">RRF 底层分:</span>
            <span class="metric-value">{{ activeSource.rrf_score }}</span>
          </div>
        </div>

        <div class="source-chunk-container">
          <div class="chunk-title">知识库原生 Chunk</div>
          <div class="chunk-content markdown-body" v-html="parsedChunkHtml"></div>
        </div>
      </template>
    </el-dialog>

    <el-image-viewer
      v-if="imageViewerVisible"
      :url-list="[previewImageUrl]"
      @close="imageViewerVisible = false"
      hide-on-click-modal
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css' 
import { useClipboard } from '@vueuse/core'
import { ElImageViewer } from 'element-plus' // 🚨 引入全屏图片放大组件

const props = defineProps({
  content: { type: String, required: true },
  sources: { type: Array, default: () => [] }
})

const { copy } = useClipboard()

// 弹窗状态
const dialogVisible = ref(false)
const activeSource = ref(null)

// 图片预览状态
const imageViewerVisible = ref(false)
const previewImageUrl = ref('')

// ==========================================
// 主干道渲染器：带 Artifact 拦截与样式注入
// ==========================================
const mainRenderer = new marked.Renderer()

mainRenderer.code = (codeArg, infostring) => {
  const code = typeof codeArg === 'object' ? (codeArg.text || '') : (codeArg || '');
  const language = typeof codeArg === 'object' ? (codeArg.lang || '') : (infostring || '');

  const isArtifact = language?.includes('nexus-artifact') || code.includes("<div class='table-wrapper'>");

  if (isArtifact) {
    const isComplete = code.includes('</table>') && code.trim().endsWith('</div>');
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
    return `<div class="nexus-artifact-ready">${code}</div>`;
  }

  const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(code, { language: validLanguage }).value;
  return `<div class="code-block-wrapper"><pre><code class="hljs ${validLanguage}">${highlighted}</code></pre></div>`;
}

// 主干道计算属性
const finalHtml = computed(() => {
  let text = props.content || ''
  text = text.replace(/^\[\^\d+\]:.*$/gm, '')
  text = text.replace(/(?:^|\n)(?:### |\*\*|)?(?:参考来源|参考文献|引用依据|引用溯源|参考资料)(?:\*\*|：|:)?\s*(?=\n|$)/g, '')
  text = text.replace(/\[\^(\d+)\]/g, (match, id) => {
    return `<sup class="citation-node" data-id="${id}">[${id}]</sup>`
  })
  return marked.parse(text, { renderer: mainRenderer, breaks: true, gfm: true })
})

// ==========================================
// 🚨 修复1：原生 Chunk 的纯净渲染器
// (不带任何 Artifact 拦截逻辑，保证原生源码原汁原味展示)
// ==========================================
const pureRenderer = new marked.Renderer()
const parsedChunkHtml = computed(() => {
  if (!activeSource.value || !activeSource.value.chunk) return ''
  return marked.parse(activeSource.value.chunk, { renderer: pureRenderer, breaks: true, gfm: true })
})

const openSourceDialog = (source) => { activeSource.value = source; dialogVisible.value = true }

// 全局事件代理中心
const handleBodyClick = async (e) => {
  // 1. 处理复制代码
  if (e.target.closest('.copy-btn')) {
    const code = decodeURIComponent(e.target.closest('.copy-btn').getAttribute('data-code'))
    await copy(code)
  }
  // 2. 处理文献引用点击
  if (e.target.closest('.citation-node')) {
    const id = e.target.closest('.citation-node').getAttribute('data-id')
    openSourceDialog(props.sources.find(s => s.id === id))
  }
  // 🚨 修复2：拦截图片点击，开启放大预览
  if (e.target.tagName === 'IMG') {
    previewImageUrl.value = e.target.src
    imageViewerVisible.value = true
  }
}
</script>

<style scoped>
/* ==========================================
   正文排版
   ========================================== */
.markdown-body { 
  color: #18181b; 
  line-height: 1.75; 
  font-size: 14.5px; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.markdown-body :deep(p) { margin-bottom: 14px; }

/* ==========================================
   🚨 修复2：图片自适应与点击交互样式
   ========================================== */
.markdown-body :deep(img) {
  max-width: 100%;       /* 绝对锁死边界，永不溢出 */
  height: auto;          /* 保持宽高比 */
  border-radius: 8px;
  border: 1px solid #e4e4e7;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: zoom-in;       /* 提示用户可放大 */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin: 12px 0;
  display: block;
}
.markdown-body :deep(img:hover) {
  transform: scale(1.01);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* ==========================================
   表格控制
   ========================================== */
:deep(.table-wrapper) {
  margin: 18px 0; border-radius: 10px; border: 1px solid #e4e4e7;
  overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
:deep(table) {
  width: 100% !important; max-width: 100% !important;
  border-collapse: collapse !important; table-layout: fixed !important; 
}
:deep(th) {
  background: #f8fafc; color: #52525b; font-weight: 600; padding: 11px 14px; 
  text-align: left; font-size: 13.5px; border-bottom: 1px solid #e4e4e7; border-right: 1px solid #f4f4f5;
}
:deep(td) {
  padding: 11px 14px; border-bottom: 1px solid #f4f4f5; border-right: 1px solid #f4f4f5;
  color: #27272a; font-size: 13.5px; vertical-align: middle;
  word-wrap: break-word !important; word-break: break-all !important;
}
:deep(tr:last-child td) { border-bottom: none; }
:deep(tr:hover td) { background: #fafafa; }

/* ==========================================
   Artifacts 与溯源网络
   ========================================== */
:deep(.nexus-artifact-loading) {
  margin: 16px 0; padding: 16px 20px; background-color: #f8fafc; 
  border: 1px solid #e2e8f0; border-radius: 10px; display: flex; align-items: center;
}
:deep(.loading-content-core) { display: flex; align-items: center; gap: 10px; color: #2563eb; font-size: 13.5px; font-weight: 500; }
:deep(.nexus-artifact-loading .spin-icon-fixed) {
  width: 16px !important; height: 16px !important; min-width: 16px !important; min-height: 16px !important;
  color: #2563eb !important; animation: spinCore 1.5s linear infinite !important;
}
@keyframes spinCore { 100% { transform: rotate(360deg); } }
:deep(.nexus-artifact-ready) { display: block; }

.citation-node { cursor: pointer; color: #2563eb; font-weight: 600; font-size: 11px; padding: 0 3px; vertical-align: super; }
.citation-node:hover { text-decoration: underline; }
.citation-footer { margin-top: 2.5rem; padding: 16px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; }
.citation-title { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #475569; margin-bottom: 12px; }
.citation-list { 
  list-style: none; 
  padding-left: 4px; /* 稍微留一点点呼吸空间 */
  margin: 0; 
  color: #64748b; 
}
.cite-ref-item { margin-bottom: 6px; cursor: pointer; transition: color 0.2s; }
.cite-ref-item:hover { color: #2563eb; text-decoration: underline; }
.ref-id { font-weight: 600; color: #2563eb; margin-right: 6px; }

/* ==========================================
   弹窗与 原生 Chunk 内部样式重构
   ========================================== */
:deep(.source-dialog) { border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important; }
:deep(.source-dialog .el-dialog__header) { background-color: #f8fafc; border-bottom: 1px solid #f1f5f9; padding: 20px 24px; margin-right: 0; }
:deep(.source-dialog .el-dialog__title) { font-weight: 600; font-size: 16px; color: #0f172a; }
.source-meta-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.meta-badge { background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid #bfdbfe; }
.meta-text { font-size: 14px; font-weight: 600; color: #334155; }

.score-metrics { display: flex; gap: 20px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0; }
.metric-item { display: flex; align-items: center; gap: 8px; }
.metric-label { font-size: 12.5px; color: #64748b; font-weight: 500;}
.metric-value { font-size: 15px; color: #0f172a; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

.source-chunk-container { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; }
.chunk-title { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

/* 🚨 修复1：赋予 Chunk 内部独立滚动的白底视图 */
.chunk-content {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  max-height: 400px; /* 限制最高高度，出现滚动条 */
  overflow-y: auto;
}
/* 防止 Chunk 里的图片被误认为可以点击放大（源码层面的预览不需要响应式） */
.chunk-content :deep(img) { cursor: default; transform: none; box-shadow: none; border: 1px solid #e2e8f0;}
.chunk-content :deep(p:last-child) { margin-bottom: 0; }
</style>