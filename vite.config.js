import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,      // 固定前端端口，方便后端 CORS 配置
    open: true       // 启动时自动打开浏览器
  }
})