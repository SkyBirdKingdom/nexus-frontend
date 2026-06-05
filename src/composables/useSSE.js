import { useChatStore } from '../stores/chatStore'

export function useSSE() {
  const chatStore = useChatStore()

  const sendMessage = async (userText) => {
    if (!userText.trim() || chatStore.isGenerating) return

    // 1. 用户消息上屏
    chatStore.addMessage({ role: 'user', content: userText })
    chatStore.isGenerating = true
    chatStore.agentTraces = [] // 清空上一轮的轨迹

    // 2. 预先推入一个空的 AI 消息，准备接收流式数据
    chatStore.addMessage({ role: 'ai', content: '' })

    try {
      // 3. 发起原生 Fetch 请求对接后端的双路流生成器
      const response = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText,
          thread_id: chatStore.threadId
        })
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      // 4. 解析 SSE 数据流
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            if (dataStr === '[DONE]') {
              chatStore.isGenerating = false
              return
            }

            try {
              const parsedData = JSON.parse(dataStr)
              
              // 根据后端的双路流格式进行状态分发
              if (parsedData.status === 'text') {
                // 纯文本 Token 流，追加到打字机
                chatStore.appendToLastMessage(parsedData.content)
              } else if (parsedData.status === 'sources') {
                // 🚀 核心新增：接收后端传来的纯净 Chunk 数据，挂载到当前消息对象上
                const lastMsg = chatStore.messages[chatStore.messages.length - 1]
                lastMsg.sources = parsedData.data
              } else {
                // Agent 状态流 (planning, working, start)，追加到发光时间线
                chatStore.agentTraces.push(parsedData)
              }
            } catch (e) {
              console.warn('SSE 解析跳过此行:', dataStr)
            }
          }
        }
      }
    } catch (error) {
      console.error('通信中断:', error)
      chatStore.appendToLastMessage('\n\n**[系统提示：网络连接中断，请重试]**')
    } finally {
      chatStore.isGenerating = false
    }
  }

  return { sendMessage }
}