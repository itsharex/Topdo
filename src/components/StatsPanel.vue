<template>
  <div class="stats-panel task-scrollbar">
    <header class="stats-header">
      <h2>本周统计</h2>
      <span>{{ weekRange }}</span>
    </header>

    <section class="progress-ring-section">
      <div class="weekly-count" aria-hidden="true">
        <strong>{{ taskStore.weekCreatedCompletedCount }}</strong>
        <span>项</span>
      </div>
      <div class="progress-info">
        <strong>本周创建任务完成数</strong>
        <p>本周创建 {{ taskStore.weekCreatedTaskCount }} 项 · 已完成 {{ taskStore.weekCreatedCompletedCount }} 项</p>
      </div>
    </section>

    <div class="stats-cards">
      <StatCard :value="taskStore.weekCompletedCount" label="本周完成" :trend="weekTrendText" trend-tone="green" highlight />
      <StatCard :value="taskStore.completionStreak" label="连续天数" trend="保持节奏中" trend-tone="amber" />
      <StatCard :value="taskStore.todayCompletedCount" label="今日完成" :trend="todayTrendText" trend-tone="blue" />
      <StatCard :value="taskStore.totalTaskCount" label="累计任务" :trend="`${taskStore.completedTaskCount} 个已完成`" />
    </div>

    <BarChart title="近 7 天完成" :summary="`合计 ${totalRecentCount} 项`" :data="chartData" :height="88" />

    <section class="achievement-section">
      <span class="achievement-emoji">🐱</span>
      <div>
        <strong>今日猫咪状态</strong>
        <p>{{ catStatusText }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import BarChart from './ui/BarChart.vue';
import StatCard from './ui/StatCard.vue';

const taskStore = useTaskStore();

function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const weekRange = computed(() => {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
});
const totalRecentCount = computed(() => taskStore.recentCompletionStats.reduce((sum, day) => sum + day.count, 0));
const chartData = computed(() => taskStore.recentCompletionStats.map((day, index, list) => ({
  label: index === list.length - 1 ? '今天' : day.label,
  value: day.count,
  isToday: index === list.length - 1
})));
const weekTrendText = computed(() => totalRecentCount.value > 0 ? `近 7 天完成 ${totalRecentCount.value} 项` : '本周还未完成任务');
const todayTrendText = computed(() => taskStore.pendingTaskCount > 0 ? `还剩 ${taskStore.pendingTaskCount} 项` : '今日任务已清空');
const catStatusText = computed(() => {
  if (taskStore.totalTaskCount > 0 && taskStore.completedTaskCount >= taskStore.totalTaskCount) {
    return '全部任务清空，猫咪会戴上皇冠。';
  }
  if (taskStore.todayCompletedCount >= 3) {
    return '完成 3 个以上，猫咪正在开心玩耍。';
  }
  if (taskStore.todayCompletedCount >= 1) {
    return '完成 1 个任务，猫咪已经醒来。';
  }
  return '完成 1 个任务后，猫咪会醒来。';
});
</script>

<style scoped>
.stats-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  z-index: 20;
  max-height: min(560px, calc(100vh - 132px));
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  gap: 16px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: 18px;
  background: color-mix(in srgb, var(--bg-solid) 96%, transparent);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(18px);
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.stats-header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.stats-header span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.progress-ring-section {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-solid);
}

.weekly-count {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  flex: 0 0 auto;
  border-radius: 16px;
  background: color-mix(in srgb, var(--accent-blue) 10%, var(--bg-solid));
  color: var(--accent-blue);
}

.weekly-count strong {
  font-size: 22px;
  line-height: 1;
  font-weight: 800;
}

.weekly-count span {
  font-size: 13px;
  line-height: 1;
  font-weight: 700;
}

.progress-info {
  min-width: 0;
}

.progress-info strong {
  display: block;
  font-size: 14px;
  color: var(--text-primary);
}

.progress-info p {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.achievement-section {
  padding: 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 14px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
}

.achievement-emoji {
  font-size: 22px;
  line-height: 1.2;
}

.achievement-section strong {
  display: block;
  font-size: 13px;
  color: var(--text-primary);
}

.achievement-section p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-secondary);
}
</style>
