<template>
  <div class="markdown-body" v-html="renderedHtml" @click="handleCopy"></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import markedFootnote from 'marked-footnote'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css' // 极客暗黑主题
import { useClipboard } from '@vueuse/core'

const props = defineProps({
  content: {
    type: String,
    required: true,
    default: ''
  }
})

const { copy } = useClipboard()

// 自定义 marked 渲染器，拦截代码块，注入复制按钮
const renderer = new marked.Renderer()
renderer.code = (code, language) => {
  const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
  const highlighted = hljs.highlight(code, { language: validLanguage }).value
  
  // 注入精美的 Mac 风格代码块包裹器和复制按钮
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

marked.setOptions({
  renderer,
  breaks: true, // 支持回车换行
  gfm: true     // 支持 GitHub 风格的 Markdown (表格、任务列表等)
})

// 🚨 2. 挂载脚注插件
marked.use(markedFootnote())

const renderedHtml = computed(() => marked.parse(props.content))

// 事件委托：处理代码块复制按钮的点击事件
const handleCopy = async (e) => {
  const btn = e.target.closest('.copy-btn')
  if (!btn) return
  
  const code = decodeURIComponent(btn.getAttribute('data-code'))
  await copy(code)
  
  // 简单的复制成功反馈
  const originalHtml = btn.innerHTML
  btn.innerHTML = '✅ 已复制'
  btn.classList.add('copied')
  setTimeout(() => {
    btn.innerHTML = originalHtml
    btn.classList.remove('copied')
  }, 2000)
}
</script>

<style scoped>
/* ==========================================
   企业级自适应样式与极客排版
   ========================================== */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #334155;
  scroll-behavior: smooth;
}

/* 核心修复：多模态图片的绝对自适应 */
:deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin: 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 代码块外层包裹 */
:deep(.code-block-wrapper) {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #282c34;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 代码块顶部操作栏 */
:deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #1e2227;
  color: #abb2bf;
  font-size: 12px;
  font-family: monospace;
}

/* 一键复制按钮 */
:deep(.copy-btn) {
  background: transparent;
  border: none;
  color: #abb2bf;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

:deep(.copy-btn:hover) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

:deep(.copy-btn.copied) {
  color: #10b981; /* 复制成功的绿色 */
}

:deep(pre) {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

/* 表格样式美化 */
:deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}
:deep(th), :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
}
:deep(th) {
  background-color: #f8fafc;
}

/* ==========================================
   引文与脚注样式 (溯源模块)
   ========================================== */

/* 正文中的上标角标 (如 [1]) */
:deep(sup.footnote-ref) {
  margin: 0 2px;
}

:deep(sup.footnote-ref a) {
  color: #3b82f6; /* 科技蓝 */
  text-decoration: none;
  font-weight: 600;
  padding: 2px 4px;
  background-color: #eff6ff;
  border-radius: 4px;
  transition: all 0.2s ease;
}

:deep(sup.footnote-ref a:hover) {
  background-color: #3b82f6;
  color: #ffffff;
}

/* 底部来源列表的外层包裹 */
:deep(section.footnotes) {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px dashed #cbd5e1; /* 虚线分割，弱化视觉感 */
  font-size: 13px;
  color: #64748b;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 16px 24px;
}

/* 底部来源列表项 */
:deep(.footnotes ol) {
  padding-left: 20px;
  margin: 0;
}

:deep(.footnotes li) {
  margin-bottom: 8px;
  line-height: 1.5;
}

/* 返回正文处的返回箭头 (↩) */
:deep(.footnote-backref) {
  text-decoration: none;
  color: #94a3b8;
  margin-left: 8px;
  font-family: monospace;
  transition: color 0.2s ease;
}

:deep(.footnote-backref:hover) {
  color: #3b82f6;
}
</style>