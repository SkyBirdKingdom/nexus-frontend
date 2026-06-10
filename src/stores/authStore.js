// src/stores/authStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // 从本地存储读取 Token
  const token = ref(localStorage.getItem('nexus_token') || '')
  
  // 派生状态：是否已登录
  const isAuthenticated = computed(() => !!token.value)

  // 登录成功后写入 Token
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('nexus_token', newToken)
  }

  // 安全退出
  const logout = () => {
    token.value = ''
    localStorage.removeItem('nexus_token')
    ElMessage.success('已安全注销，个人沙箱已锁定。')
  }

  return { 
    token, 
    isAuthenticated, 
    setToken, 
    logout 
  }
})