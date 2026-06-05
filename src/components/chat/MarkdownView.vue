<template>
  <div class="markdown-container">
    <div class="markdown-body" v-html="renderedHtml" @click="handleBodyClick"></div>

    <div v-if="sources && sources.length > 0" class="citation-footer">
      <div class="citation-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg> 
        情报溯源网络
      </div>
      <ol>
        <li 
          v-for="source in sources" 
          :key="source.id"
          class="cite-ref-item"
          @click="openSourceDialog(source)"
        >
          <span class="ref-id">[{{ source.id }}]</span> 
          <span class="ref-title">{{ source.title }}</span>
        </li>
      </ol>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="📄 原始底层情报解析"
      width="650px"
      append-to-body
      class="source-dialog"
    >
      <template v-if="activeSource">
        <div class="source-meta-header">
          <div class="meta-badge">检索链路</div>
          <div class="meta-text">{{ activeSource.title }}</div>
          <div class="score-badges" v-if="activeSource.rerank_score !== undefined">
            <span class="score-tag rerank">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Rerank 精度: {{ activeSource.rerank_score }}
            </span>
            <span class="score-tag rrf">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>
              RRF 底层: {{ activeSource.rrf_score }}
            </span>
          </div>
        </div>
        
        <div class="source-chunk-container">
          <div class="chunk-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            知识库原生 Chunk (未经大模型修饰)
          </div>
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
  content: { type: String, required: true, default: '' },
  sources: { type: Array, default: () => [] } // 🚀 接收独立数据流
})

const { copy } = useClipboard()

const dialogVisible = ref(false)
const activeSource = ref(null)

// 还原你的高亮和复制逻辑
const renderer = new marked.Renderer()
renderer.code = (code, language) => {
  const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
  const highlighted = hljs.highlight(code, { language: validLanguage }).value
  
  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="lang-label">${validLanguage}</span>
        <button class="copy-btn" data-code="${encodeURIComponent(code)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          复制
        </button>
      </div>
      <pre><code class="hljs ${validLanguage}">${highlighted}</code></pre>
    </div>
  `
}
marked.setOptions({ renderer, breaks: true, gfm: true })

// 轻量级正文解析
const renderedHtml = computed(() => {
  let text = props.content || ''
  
  // ==========================================
  // 🚀 核心防守：强力剔除大模型肌肉记忆生成的冗余附录
  // ==========================================
  // 1. 剔除 Markdown 脚注定义 (如 [^1]: wellarchitected.pdf...)
  text = text.replace(/^\[\^\d+\]:.*$/gm, '')
  // 2. 剔除常见的附录标题 (如 ### 参考文献、**参考来源** 等)
  text = text.replace(/(###|\*\*)\s*(参考来源|参考文献|参考资料|引用依据).*\n?/g, '')
  // ==========================================

  // 将 [^1] 替换为带样式的标签
  text = text.replace(/\[\^(\d+)\]/g, (match, id) => {
    const source = props.sources.find(s => s.id === id)
    const hoverTitle = source ? source.title.replace(/"/g, '&quot;') : '溯源片段'
    return `<sup class="citation-node" data-id="${id}" title="${hoverTitle}">[${id}]</sup>`
  })

  return marked.parse(text)
})

// 弹窗逻辑
const openSourceDialog = (source) => {
  activeSource.value = source
  dialogVisible.value = true
}

// 统一处理 markdown-body 内部的点击事件（复制 & 正文角标点击）
const handleBodyClick = async (e) => {
  // 1. 处理你的复制逻辑
  const btn = e.target.closest('.copy-btn')
  if (btn) {
    const code = decodeURIComponent(btn.getAttribute('data-code'))
    await copy(code)
    const originalHtml = btn.innerHTML
    btn.innerHTML = '✅ 已复制'
    btn.classList.add('copied')
    setTimeout(() => {
      btn.innerHTML = originalHtml
      btn.classList.remove('copied')
    }, 2000)
    return
  }

  // 2. 处理正文角标点击，调出 Vue 的原生弹窗
  const citeNode = e.target.closest('.citation-node')
  if (citeNode) {
    const id = citeNode.getAttribute('data-id')
    const source = props.sources.find(s => s.id === id)
    if (source) {
      openSourceDialog(source)
    }
  }
}
</script>

<style scoped>
/* ==========================================
   完全还原你的企业级极客排版
   ========================================== */
.markdown-container { display: flex; flex-direction: column; }

.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #334155;
}

:deep(img) { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
:deep(.code-block-wrapper) { margin: 16px 0; border-radius: 8px; overflow: hidden; background-color: #282c34; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
:deep(.code-block-header) { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background-color: #1e2227; color: #abb2bf; font-size: 12px; font-family: monospace; }
:deep(.copy-btn) { background: transparent; border: none; color: #abb2bf; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; transition: all 0.2s; }
:deep(.copy-btn:hover) { background-color: rgba(255, 255, 255, 0.1); color: #ffffff; }
:deep(.copy-btn.copied) { color: #10b981; }
:deep(pre) { margin: 0; padding: 16px; overflow-x: auto; }
:deep(table) { width: 100%; border-collapse: collapse; margin: 16px 0; }
:deep(th), :deep(td) { border: 1px solid #e2e8f0; padding: 8px 12px; }
:deep(th) { background-color: #f8fafc; }

/* ==========================================
   正文角标样式 (极简、轻量、无需复杂的 CSS Hover 黑魔法)
   ========================================== */
:deep(.citation-node) {
  position: relative;
  cursor: pointer;
  color: #3b82f6;
  font-weight: 600;
  padding: 2px 4px;
  background-color: #eff6ff;
  border-radius: 4px;
  margin: 0 2px;
  transition: all 0.2s ease;
  font-family: monospace;
}
:deep(.citation-node:hover) { background-color: #3b82f6; color: #ffffff; }

/* ==========================================
   原生的 Vue 底部面板样式
   ========================================== */
.citation-footer {
  margin-top: 32px;
  padding: 16px 20px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
}
.citation-title {
  display: flex; align-items: center; gap: 6px; font-weight: 600; color: #334155;
  margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #cbd5e1;
}
.citation-footer ol { margin: 0; padding-left: 0; list-style: none; }
.cite-ref-item {
  margin-bottom: 8px; line-height: 1.5; padding: 6px 10px; border-radius: 6px; 
  cursor: pointer; transition: all 0.2s; border: 1px solid transparent; display: flex; align-items: flex-start;
}
.cite-ref-item:hover { background-color: #fff; border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.ref-id { color: #3b82f6; font-weight: bold; font-family: monospace; margin-right: 8px; flex-shrink: 0; }
.ref-title { font-family: monospace; color: #1e293b; font-weight: 500; }

/* ==========================================
   原生 Chunk 弹窗样式
   ========================================== */
.source-meta-header { display: flex; align-items: center; gap: 12px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
.meta-badge { background-color: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap; }
.meta-text { font-size: 14px; color: #334155; font-family: monospace; word-break: break-all; }

.source-chunk-container { border-left: 4px solid #10b981; background-color: #f0fdf4; border-radius: 0 8px 8px 0; overflow: hidden; }
.chunk-title { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background-color: #dcfce7; color: #166534; font-weight: 600; font-size: 13px; }
.chunk-content { padding: 16px; font-size: 14px; line-height: 1.7; color: #15803d; white-space: pre-wrap; font-family: monospace; overflow-y: auto; max-height: 350px; }

/* ==========================================
   打分徽章样式
   ========================================== */
.score-badges {
  display: flex;
  gap: 8px;
  margin-left: auto; /* 将徽章自动推到弹窗的最右侧 */
}

.score-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
}

.score-tag.rerank {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.score-tag.rrf {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}
</style>