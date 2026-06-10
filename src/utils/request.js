// src/utils/request.js
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import { ElMessage } from 'element-plus'

// 1. 创建 Axios 实例，自动读取环境变量
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000 // 15秒超时
})

// 2. 请求拦截器：发请求前，自动带上 JWT Token
request.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 3. 响应拦截器：统一处理错误（比如 401 鉴权失效）
request.interceptors.response.use(
  response => {
    // 正常返回，直接剥离一层 data，让组件里少写一个 .data
    return response.data 
  },
  error => {
    if (error.response) {
      // 如果是 401，直接强制登出
      if (error.response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        ElMessage.error('身份凭证已过期，请重新登录')
      } else {
        ElMessage.error(error.response.data?.detail || '服务器响应异常')
      }
    } else {
      ElMessage.error('网络中断，请检查连接')
    }
    return Promise.reject(error)
  }
)

export default request