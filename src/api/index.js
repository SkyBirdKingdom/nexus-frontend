// src/api/index.js
import request from '../utils/request'

// 暴露基础 URL，供 SSE 流和 Element Plus 的 Upload 这种无法使用 Axios 的原生组件使用
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// 认证模块接口
export const authApi = {
  login(username, password) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    // 直接调 request，拦截器会自动处理报错
    return request.post('/api/v1/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  
  register(username, password) {
    return request.post('/api/v1/auth/register', { username, password })
  }
}

// 🚨 新增：聊天与会话 API 集合
export const chatApi = {
  getSessions() {
    return request.get('/api/v1/chat/sessions')
  },
  deleteSession(threadId) {
    return request.delete(`/api/v1/chat/sessions/${threadId}`)
  },
  // 🚨 新增：拉取全量历史状态树
  getChatHistory(threadId) {
    return request.get(`/api/v1/chat/history/${threadId}`)
  }
}

// 🚨 新增：联邦凭证保险库 API
export const credentialsApi = {
  bind(platform, token) {
    return request.post('/api/v1/credentials/bind', { platform, token })
  },
  list() {
    return request.get('/api/v1/credentials/list')
  },
  unbind(platform) {
    return request.delete(`/api/v1/credentials/${platform}`)
  }
}