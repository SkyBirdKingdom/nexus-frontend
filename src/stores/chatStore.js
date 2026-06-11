// src/stores/chatStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatApi } from '../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const isGenerating = ref(false)
  
  // 1. 路由初始化读取
  const getInitialThreadId = () => {
    const hash = window.location.hash
    if (hash && hash.startsWith('#/chat/')) {
      return hash.replace('#/chat/', '')
    }
    return 'nexus_session_' + Date.now()
  }
  
  const threadId = ref(getInitialThreadId())
  const agentTraces = ref([])
  const sessionList = ref([])

  // 同步修改浏览器地址栏的 Hash
  const updateUrlRoute = (id) => {
    window.history.pushState(null, '', `#/chat/${id}`)
  }

  // 🚨 2. 核心重构：拉取云端会话并加入【路由鉴权守卫】
  const fetchSessions = async () => {
    try {
      const res = await chatApi.getSessions()
      sessionList.value = res.data || []
      
      const currentHashId = window.location.hash.replace('#/chat/', '')
      
      if (currentHashId && currentHashId.trim() !== '') {
        // 🛡️ 安全拦截守卫：检查当前的 Hash ID 是否在刚拉取下来的属于新用户的列表中
        if (sessionList.value.some(s => s.id === currentHashId)) {
          // 合法历史记忆，安全反序列化
          switchChat(currentHashId)
        } else {
          // 🚨 发现越权或旧用户的垃圾残留 Hash！果断熔断拒绝，强制开辟新空间
          console.warn('嗅探到非法或残留的路由会话，已安全重置空间。')
          createNewChat()
        }
      } else {
        // URL 干净时，默认行为
        createNewChat()
      }
    } catch (e) {
      console.error('拉取沙箱索引失败', e)
    }
  }

  const deleteSession = async (id) => {
    try {
      await ElMessageBox.confirm('确定要抹除这个沙箱的全部记忆吗？此操作不可逆。', '安全警告', {
        confirmButtonText: '确认抹除',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await chatApi.deleteSession(id)
      ElMessage.success('沙箱记忆已被彻底抹除')
      
      if (threadId.value === id) {
        createNewChat()
      }
      await fetchSessions()
    } catch (e) {
      if (e !== 'cancel') console.error('删除会话异常', e)
    }
  }

  const addMessage = (msg) => {
    messages.value.push(msg)
  }

  const appendToLastMessage = (chunk) => {
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg && lastMsg.role === 'ai') {
      lastMsg.content += chunk
    }
  }

  const createNewChat = () => {
    if (isGenerating.value) return
    messages.value = []
    agentTraces.value = []
    threadId.value = 'nexus_session_' + Date.now()
    updateUrlRoute(threadId.value)
  }

  const switchChat = async (id) => {
    if (isGenerating.value) return
    threadId.value = id
    updateUrlRoute(id)
    
    messages.value = []
    agentTraces.value = []
    
    try {
      const res = await chatApi.getChatHistory(id)
      if (res.data && res.data.length > 0) {
        messages.value = res.data
      }
    } catch (e) {
      ElMessage.error('加载历史沙箱记忆失败')
    }
  }

  // 🚨 3. 核心新增：企业级内存断路器 (登出时被调用，斩断全部状态)
  const clearAllState = () => {
    messages.value = []
    agentTraces.value = []
    sessionList.value = []
    threadId.value = 'nexus_session_' + Date.now()
    window.location.hash = '' // 抹平 URL 残留
  }

  return {
    messages,
    isGenerating,
    threadId,
    agentTraces,
    sessionList,
    fetchSessions,
    deleteSession,
    addMessage,
    appendToLastMessage,
    createNewChat,
    switchChat,
    clearAllState // 🚨 暴露给登出逻辑调用
  }
})