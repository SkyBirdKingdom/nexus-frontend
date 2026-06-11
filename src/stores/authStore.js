// src/stores/authStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from './chatStore' // 🚨 引入聊天库进行状态摧毁

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('nexus_token') || '')
  
  const isAuthenticated = computed(() => !!token.value)

  const currentUser = computed(() => {
    if (!token.value) return null
    try {
      const base64Url = token.value.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload)
      return {
        user_id: payload.sub,
        username: payload.username
      }
    } catch (e) {
      console.error('JWT 解析异常:', e)
      return null
    }
  })

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('nexus_token', newToken)
  }

  // 🚨 核心重构：退出登录时，对全量 Store 执行熔断清理
  const logout = () => {
    token.value = ''
    localStorage.removeItem('nexus_token')
    
    // 🚨 核心联动：动态获取 chatStore 并执行物理归零
    const chatStore = useChatStore()
    chatStore.clearAllState()
    
    ElMessage.success('已安全注销，个人沙箱已锁定。')
  }

  return { 
    token, 
    isAuthenticated, 
    currentUser,
    setToken, 
    logout 
  }
})