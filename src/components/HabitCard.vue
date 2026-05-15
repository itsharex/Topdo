<template>
  <article class="habit-card" :class="{ checked: habit.todayChecked }" @click="emit('open')">
    <div class="habit-emoji" :style="{ background: `${habit.color}22` }">{{ habit.emoji }}</div>
    <div class="habit-info">
      <div class="habit-name">{{ habit.name }}</div>
      <div class="habit-meta">{{ frequencyLabel }} · 连续{{ habit.currentStreak }}天</div>
      <div class="week-dots">
        <span v-for="(status, index) in habit.weekStatus" :key="index" class="week-dot" :class="status"></span>
      </div>
    </div>
    <button type="button" class="checkin-btn" :class="{ done: habit.todayChecked }" @click.stop="emit('check-in')">
      {{ habit.todayChecked ? `✓ ${habit.todayCheckTime || ''}` : '打卡' }}
    </button>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HabitWithStats } from '../types/habit';

const props = defineProps<{ habit: HabitWithStats }>();
const emit = defineEmits<{ (event: 'check-in'): void; (event: 'open'): void }>();
const frequencyLabel = computed(() => {
  if (props.habit.frequency_type === 'daily') return '每天';
  if (props.habit.frequency_type === 'weekdays') return '工作日';
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `每周${(props.habit.frequency_days || []).map((d) => days[d]).join('、') || '自定义'}`;
});
</script>

<style scoped>
.habit-card { margin: 8px 10px; padding: 10px; display: grid; grid-template-columns: 40px minmax(0,1fr) auto; gap: 10px; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--bg-solid); box-shadow: var(--shadow-sm); cursor: pointer; }
.habit-card.checked { opacity: .76; }
.habit-emoji { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; font-size: 22px; }
.habit-name { color: var(--text-primary); font-weight: 600; }
.habit-meta { margin-top: 2px; color: var(--text-tertiary); font-size: 11px; }
.week-dots { margin-top: 7px; display: flex; gap: 4px; }
.week-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--bg-tertiary); }
.week-dot.done { background: #10b981; }
.week-dot.missed { background: #ef4444; }
.week-dot.today { border: 1px solid var(--primary); background: transparent; }
.week-dot.future, .week-dot.na { opacity: .45; }
.checkin-btn { height: 28px; padding: 0 12px; border: 1px solid color-mix(in srgb, #10b981 50%, var(--border)); border-radius: 999px; background: color-mix(in srgb, #10b981 10%, var(--bg-solid)); color: #059669; font-weight: 600; cursor: pointer; }
.checkin-btn.done { color: var(--text-tertiary); border-color: var(--border); background: var(--bg-secondary); }
</style>
