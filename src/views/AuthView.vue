<template>
  <div class="auth-container">
    <div class="studio-pure-bg"></div>
    
    <div class="auth-card">
      <div class="brand-header">
        <div class="logo-box">N</div>
        <h2>Nexus <span class="brand-text">Engine</span></h2>
        <p class="subtitle">Personal Enterprise Agent</p>
      </div>

      <div class="auth-tabs">
        <div :class="['tab', { active: isLogin }]" @click="isLogin = true">安全登录</div>
        <div :class="['tab', { active: !isLogin }]" @click="isLogin = false">创建沙箱</div>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="input-group">
          <label>终端标识 (Username)</label>
          <input v-model="form.username" type="text" placeholder="输入企业分配的账户符" required />
        </div>
        <div class="input-group">
          <label>验证密钥 (Password)</label>
          <input v-model="form.password" type="password" placeholder="••••••••" required />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? '正在通讯...' : (isLogin ? '验证身份并进入' : '初始化个人沙箱') }}
        </button>
      </form>

      <div class="security-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        端到端加密 • 个人沙箱强隔离技术
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const isLogin = ref(true)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const handleSubmit = async () => {
  loading.value = true
  try {
    if (isLogin.value) {
      // 🚨 架构黑魔法：FastAPI 的 OAuth2 协议强制要求表单数据 (x-www-form-urlencoded)
      const formData = new URLSearchParams()
      formData.append('username', form.username)
      formData.append('password', form.password)

      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || '登录失败')
      
      authStore.setToken(data.access_token)
      ElMessage.success('身份验证通过，正在挂载沙箱...')
      
    } else {
      // 注册逻辑使用标准 JSON
      const response = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || '注册失败')
      
      ElMessage.success('沙箱创建成功！请进行安全登录。')
      isLogin.value = true // 注册成功后自动切回登录态
      form.password = ''
    }
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fcfcfd;
  position: relative;
  overflow: hidden;
}

.studio-pure-bg {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(at 50% 0%, #f4f4f5 0%, #fcfcfd 100%);
  z-index: 0; pointer-events: none;
}

.auth-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 400px;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
}

.brand-header { text-align: center; margin-bottom: 32px; }
.logo-box {
  width: 48px; height: 48px; margin: 0 auto 16px;
  background: #18181b; color: #ffffff;
  border-radius: 12px; display: flex; justify-content: center; align-items: center;
  font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700;
}
.brand-header h2 { margin: 0; font-size: 22px; color: #18181b; font-weight: 700; letter-spacing: -0.5px; }
.brand-text { background: linear-gradient(135deg, #2563eb, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.subtitle { color: #71717a; font-size: 13.5px; margin-top: 6px; }

.auth-tabs { display: flex; gap: 8px; margin-bottom: 24px; background: #f4f4f5; padding: 4px; border-radius: 10px; }
.tab {
  flex: 1; text-align: center; padding: 8px 0; font-size: 14px; font-weight: 600;
  color: #71717a; cursor: pointer; border-radius: 6px; transition: all 0.2s;
}
.tab.active { background: #ffffff; color: #18181b; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

.input-group { margin-bottom: 20px; }
.input-group label { display: block; font-size: 13px; font-weight: 600; color: #3f3f46; margin-bottom: 8px; }
.input-group input {
  width: 100%; box-sizing: border-box; padding: 12px 14px;
  background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px;
  font-size: 14.5px; color: #18181b; transition: all 0.2s;
}
.input-group input:focus { outline: none; box-shadow: 0 0 0 1px #2563eb inset; border-color: #2563eb; }

.submit-btn {
  width: 100%; padding: 12px; margin-top: 8px;
  background: #18181b; color: #ffffff; border: none; border-radius: 10px;
  font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  display: flex; justify-content: center; align-items: center; gap: 8px;
}
.submit-btn:hover:not(:disabled) { background: #27272a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

.security-badge {
  display: flex; justify-content: center; align-items: center; gap: 6px;
  margin-top: 24px; font-size: 12px; font-weight: 500; color: #10b981; /* 安全绿 */
}
</style>