<template>
  <section class="welcome-page">
    <div class="welcome-header">
      <div class="welcome-icon">✓</div>
      <h1 class="welcome-title">欢迎使用 Topdo</h1>
      <p class="welcome-subtitle">先选择任务保存在哪里。第一次使用推荐本地模式，马上开始。</p>
    </div>

    <div class="mode-list">
      <div class="mode-option" :class="{ selected: selectedMode === 'local' }" @click="selectedMode = 'local'">
        <div class="mode-indicator" />
        <div class="mode-icon">💻</div>
        <div class="mode-info">
          <div class="mode-name">
            本地模式
            <span class="mode-badge">推荐</span>
          </div>
          <div class="mode-desc">开箱即用，任务只保存在这台 Mac 上，离线也能用。</div>
        </div>
      </div>

      <div class="mode-option" :class="{ selected: selectedMode === 'feishu' }" @click="selectedMode = 'feishu'">
        <div class="mode-indicator" />
        <div class="mode-icon">☁️</div>
        <div class="mode-info">
          <div class="mode-name">飞书同步</div>
          <div class="mode-desc">连接飞书多维表格，适合多设备或协作；也可以稍后配置。</div>
        </div>
      </div>
    </div>

    <div class="welcome-actions">
      <button type="button" class="btn-start" @click="handleStart">
        {{ selectedMode === 'local' ? '先用本地模式开始' : '去配置飞书同步' }}
      </button>
      <button v-if="selectedMode === 'feishu'" type="button" class="btn-link" @click="selectLocalAndStart">
        稍后配置，先用本地模式
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const selectedMode = ref<'local' | 'feishu'>('local');

const emit = defineEmits<{
  (event: 'select-local'): void;
  (event: 'select-feishu'): void;
}>();

function handleStart() {
  if (selectedMode.value === 'local') {
    emit('select-local');
  } else {
    emit('select-feishu');
  }
}

function selectLocalAndStart() {
  selectedMode.value = 'local';
  emit('select-local');
}
</script>

<style scoped>
.welcome-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 20px 24px;
  height: 100%;
  box-sizing: border-box;
}

.welcome-header {
  text-align: center;
  margin-bottom: 24px;
}

.welcome-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 12px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: linear-gradient(135deg, #34c759, #1fb85f);
  color: white;
  font-size: 36px;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(52, 199, 89, 0.22);
}

.welcome-title {
  font-size: 21px;
  font-weight: 750;
  color: var(--text-primary, #1d1d1f);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  max-width: 280px;
  font-size: 12px;
  color: var(--text-secondary, #86868b);
  margin: 0;
  line-height: 1.55;
  font-weight: 400;
}

.mode-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: var(--bg-solid, #fff);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.08));
}

.mode-option:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.03));
}

.mode-option.selected {
  background: rgba(0, 122, 255, 0.06);
  border-color: rgba(0, 122, 255, 0.28);
  box-shadow: 0 10px 24px rgba(0, 122, 255, 0.08);
}

.mode-indicator {
  width: 3px;
  height: 28px;
  border-radius: 1.5px;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.mode-option.selected .mode-indicator {
  background: var(--primary, #007aff);
}

.mode-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-info {
  flex: 1;
  min-width: 0;
}

.mode-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1d1d1f);
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 11px;
  line-height: 1.45;
  color: var(--text-secondary, #86868b);
}

.mode-badge {
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(52, 199, 89, 0.12);
  color: #1f9d55;
  font-size: 10px;
  font-weight: 650;
}

.welcome-actions {
  width: 100%;
  display: grid;
  gap: 10px;
  justify-items: center;
}

.btn-start {
  width: 100%;
  height: 42px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: var(--primary, #007aff);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, sans-serif);
}

.btn-start:hover {
  background: var(--primary-hover, #0066d6);
}

.btn-start:active {
  transform: scale(0.98);
}

.btn-link {
  border: 0;
  background: transparent;
  color: var(--primary, #007aff);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

@media (prefers-color-scheme: dark) {
  .mode-option.selected {
    background: rgba(10, 132, 255, 0.1);
    border-color: rgba(10, 132, 255, 0.2);
  }
}

:root.dark .mode-option.selected {
  background: rgba(10, 132, 255, 0.1);
  border-color: rgba(10, 132, 255, 0.2);
}

:root.dark .mode-option:hover {
  background: rgba(255, 255, 255, 0.04);
}
</style>
