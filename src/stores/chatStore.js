import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const isGenerating = ref(false)
  const threadId = ref('nexus_session_' + Date.now())
  const agentTraces = ref([])
  
  // 本地持久化的历史会话列表
  const sessionList = ref(JSON.parse(localStorage.getItem('nexus_sessions') || '[]'))

  // 监听会话列表变化并存入 localStorage
  watch(sessionList, (newList) => {
    localStorage.setItem('nexus_sessions', JSON.stringify(newList))
  }, { deep: true })

  const addMessage = (msg) => {
    messages.value.push(msg)
    // 如果是用户的第一条消息，自动将当前会话保存到左侧历史列表中
    if (messages.value.length === 1 && msg.role === 'user') {
      const title = msg.content.substring(0, 15) + (msg.content.length > 15 ? '...' : '')
      sessionList.value.unshift({
        id: threadId.value,
        title: title,
        date: new Date().toLocaleDateString()
      })
    }
  }

  const appendToLastMessage = (chunk) => {
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg && lastMsg.role === 'ai') {
      lastMsg.content += chunk
    }
  }

  // 新建对话
  const createNewChat = () => {
    if (isGenerating.value) return
    messages.value = []
    agentTraces.value = []
    threadId.value = 'nexus_session_' + Date.now() // 生成全新的隔离 ID
  }

  // 切换历史对话 (当前仅做纯前端 UI 切换，后续可对接后端加载历史记录)
  const switchChat = (id) => {
    if (isGenerating.value || threadId.value === id) return
    threadId.value = id
    messages.value = []
    agentTraces.value = []
    messages.value.push({ 
      role: 'ai', 
      content: '> 💡 **系统提示**: 已切换到历史会话 `'+id+'`。\n\n后端 LangGraph 的 SqliteSaver 已保留此会话的记忆上下文。您可以继续提问！' 
    })
  }

  return {
    messages,
    isGenerating,
    threadId,
    agentTraces,
    sessionList,
    addMessage,
    appendToLastMessage,
    createNewChat,
    switchChat
  }
})