// src/stores/chatStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatApi } from '../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const isGenerating = ref(false)
  
  // 🚨 路由初始化：优先从浏览器 URL 的 Hash (#/) 中读取会话 ID
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

  // 同步 URL 状态
  const updateUrlRoute = (id) => {
    window.history.pushState(null, '', `#/chat/${id}`)
  }

  const fetchSessions = async () => {
    try {
      const res = await chatApi.getSessions()
      sessionList.value = res.data || []
      
      // 🚨 如果当前 URL 中包含有效的历史 ID，且当前面板是空的，自动帮用户激活拉取
      const currentHashId = window.location.hash.replace('#/chat/', '')
      if (currentHashId && messages.value.length === 0 && sessionList.value.some(s => s.id === currentHashId)) {
        switchChat(currentHashId)
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

  // 🚨 满血复活：真实拉取云端对话数据
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
      } else {
        messages.value.push({ 
          role: 'ai', 
          content: '> 💡 **系统提示**: 该沙箱虽然在索引中，但 LangGraph 记忆树为空，可能处于初始化状态。' 
        })
      }
    } catch (e) {
      ElMessage.error('加载历史沙箱记忆失败')
    }
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
    switchChat
  }
})