<template>
  <div class="trace-wrapper" v-if="traces && traces.length > 0">
    <div class="trace-header">
      <el-icon class="is-loading" color="#10b981"><Loading /></el-icon>
      <span>Nexus 智能体中枢正在协同作业...</span>
    </div>
    
    <el-timeline class="custom-timeline">
      <el-timeline-item
        v-for="(trace, index) in traces"
        :key="index"
        :type="getIconType(trace.status)"
        :color="getColor(trace.status)"
        :size="trace.status === 'working' ? 'small' : 'large'"
        :hollow="trace.status === 'working'"
      >
        <div class="trace-content">
          <span :class="['role-badge', trace.status]">
            {{ getRoleName(trace.status) }}
          </span>
          
          <span class="trace-text">
            <template v-if="trace.status === 'planning'">
              制定了 {{ trace.tasks?.length || 0 }} 步深度检索计划
            </template>
            <template v-else-if="trace.status === 'working'">
              正在攻坚: <strong>{{ trace.task_name }}</strong>
            </template>
            <template v-else-if="trace.status === 'start'">
              {{ trace.content }}
            </template>
            <template v-else-if="trace.status === 'synthesizing'">
              {{ trace.content }}
            </template>
          </span>
        </div>
        
        <div v-if="trace.status === 'working' && trace.fact" class="fact-box">
          <el-icon><Document /></el-icon>
          <span class="fact-preview">{{ trace.fact.substring(0, 60) }}...</span>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup>
import { Loading, Document } from '@element-plus/icons-vue'

defineProps({
  traces: {
    type: Array,
    required: true,
    default: () => []
  }
})

// 状态映射引擎
const getRoleName = (status) => {
  const map = {
    start: '🖥️ 系统',
    planning: '👔 规划师',
    working: '👷 研究员',
    synthesizing: '🧑‍🎨 主编'
  }
  return map[status] || '🤖 Agent'
}

const getColor = (status) => {
  const map = {
    start: '#94a3b8',      // 灰色
    planning: '#8b5cf6',   // 紫色
    working: '#3b82f6',    // 蓝色
    synthesizing: '#10b981'// 绿色
  }
  return map[status] || '#cbd5e1'
}

const getIconType = (status) => {
  return status === 'synthesizing' ? 'success' : 'primary'
}
</script>

<style scoped>
.trace-wrapper {
  margin: 10px 0 20px 0;
  padding: 16px 20px;
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.trace-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #cbd5e1;
}

.custom-timeline {
  margin-left: 4px;
  padding-left: 0;
}

/* 穿透修改 Element Plus 的 Timeline 样式 */
:deep(.el-timeline-item__node) {
  box-shadow: 0 0 8px currentColor; /* 发光效果 */
}

.trace-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.role-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  color: white;
}
.role-badge.start { background: #64748b; }
.role-badge.planning { background: #8b5cf6; }
.role-badge.working { background: #3b82f6; }
.role-badge.synthesizing { background: #10b981; }

.trace-text {
  color: #334155;
}

.fact-box {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #e2e8f0;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  font-size: 12px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
}
.fact-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>