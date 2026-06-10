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