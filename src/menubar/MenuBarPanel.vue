<template>
  <main class="menubar-panel">
    <header class="menubar-header">
      <div>
        <strong>今日 · {{ todayLabel }}</strong>
        <span>{{ weekdayLabel }}</span>
      </div>
      <span>{{ completedToday }}/{{ todayTasks.length }} 完成</span>
    </header>

    <section class="menubar-list task-scrollbar">
      <button v-for="task in todayTasks" :key="task.record_id" type="button" class="menubar-task" @click="toggleTask(task)">
        <span class="menubar-checkbox" :class="{ checked: isDone(task.status) }"><Icon v-if="isDone(task.status)" name="check-circle" :size="12" /></span>
        <span class="menubar-task-name" :class="{ done: isDone(task.status) }">{{ task.name }}</span>
        <span v-if="formatTime(task.due_date)" class="menubar-time">{{ formatTime(task.due_date) }}</span>
      </button>
      <p v-if="todayTasks.length === 0" class="menubar-empty">今天暂无到期任务</p>
    </section>

    <section v-if="appStore.habitModuleEnabled && todayHabits.length" class="menubar-habits">
      <span>习惯打卡</span>
      <div class="habit-row">
        <button v-for="habit in todayHabits" :key="habit.id" type="button" class="habit-circle" :class="{ done: habit.todayChecked }" @click="toggleHabit(habit)">
          <span>{{ habit.emoji }}</span>
          <small>{{ habit.todayChecked ? '✓' : '○' }}</small>
        </button>
      </div>
    </section>

    <form class="menubar-add" @submit.prevent="createTask">
      <input v-model="taskName" placeholder="+ 快速添加任务..." />
    </form>

    <footer class="menubar-footer">
      <button type="button" @click="openMain">打开 Topdo</button>
      <kbd>⌘O</kbd>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core';
import { emit as emitEvent, listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import Icon from '../components/Icon.vue';
import { useAppStore } from '../stores/appStore';
import { useHabitStore, isRequiredDay } from '../stores/habitStore';
import { useTaskStore } from '../stores/taskStore';
import type { Task } from '../types';
import type { HabitWithStats } from '../types/habit';
import { buildDueDateValue, splitDueDate } from '../utils/dueDate';

const taskStore = useTaskStore();
const habitStore = useHabitStore();
const appStore = useAppStore();
const taskName = ref('');
const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const todayLabel = `${today.getMonth() + 1}月${today.getDate()}日`;
const weekdayLabel = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(today);
let unlistenTasksUpdated: UnlistenFn | null = null;

const todayTasks = computed(() => taskStore.tasks.filter((task) => splitDueDate(task.due_date).date === todayKey));
const completedToday = computed(() => todayTasks.value.filter((task) => isDone(task.status)).length);
const todayHabits = computed(() => habitStore.habitsWithStats.filter((habit) => isRequiredDay(today, habit)));

function isDone(status: string) {
  return status.includes('已完成');
}

function formatTime(raw?: string) {
  const time = splitDueDate(raw).time;
  return time || '';
}

async function toggleTask(task: Task) {
  await taskStore.updateTaskStatus(task.record_id, isDone(task.status) ? '待处理' : '已完成');
  await emitEvent('tasks-updated');
}

async function toggleHabit(habit: HabitWithStats) {
  if (habit.todayChecked) await habitStore.uncheckIn(habit.id, todayKey);
  else await habitStore.checkIn(habit.id);
}

async function createTask() {
  const name = taskName.value.trim();
  if (!name) return;
  taskName.value = '';
  await taskStore.createTask({ name, priority: '普通', status: '待处理', due_date: buildDueDateValue(todayKey, '') });
  await emitEvent('tasks-updated');
}

async function openMain() {
  await invoke('show_main_window');
  await getCurrentWindow().hide();
}

onMounted(async () => {
  appStore.load();
  await taskStore.initMode();
  await taskStore.fetchTasks().catch(() => undefined);
  if (appStore.habitModuleEnabled) await habitStore.fetchHabits().catch(() => undefined);
  unlistenTasksUpdated = await listen('tasks-updated', () => {
    void taskStore.fetchTasks().catch(() => undefined);
  });
});

onUnmounted(() => {
  unlistenTasksUpdated?.();
});
</script>

<style scoped>
.menubar-panel {
  width: 320px;
  height: 420px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--bg-solid) 95%, transparent);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(20px);
}
.menubar-header, .menubar-footer { flex-shrink: 0; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); }
.menubar-header strong { display: block; font-size: 15px; color: var(--text-primary); }
.menubar-header span, .menubar-footer kbd { font-size: 12px; color: var(--text-secondary); }
.menubar-list { flex: 1; min-height: 0; overflow-y: auto; }
.menubar-task { width: 100%; height: 42px; display: flex; align-items: center; gap: 10px; padding: 0 16px; border: 0; background: transparent; color: var(--text-primary); font-family: var(--font-family); cursor: pointer; }
.menubar-task:hover { background: var(--bg-secondary); }
.menubar-checkbox { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--border); display: grid; place-items: center; color: white; flex-shrink: 0; }
.menubar-checkbox.checked { background: var(--accent-blue); border-color: var(--accent-blue); }
.menubar-task-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; font-size: 13px; }
.menubar-task-name.done { color: var(--text-tertiary); text-decoration: line-through; }
.menubar-time { color: var(--text-secondary); font-size: 12px; }
.menubar-empty { padding: 24px 16px; color: var(--text-tertiary); font-size: 13px; text-align: center; }
.menubar-habits { padding: 12px 16px; border-top: 1px solid var(--border-light); }
.menubar-habits > span { display: block; margin-bottom: 9px; font-size: 12px; color: var(--text-secondary); }
.habit-row { display: flex; gap: 10px; }
.habit-circle { width: 42px; height: 42px; border-radius: 50%; border: 1.5px solid var(--border); background: var(--bg-solid); display: grid; place-items: center; color: var(--text-secondary); cursor: pointer; }
.habit-circle.done { border-color: var(--accent-green); background: var(--accent-green-soft); color: var(--accent-green); }
.habit-circle small { font-size: 10px; }
.menubar-add { padding: 10px 16px; border-top: 1px solid var(--border-light); }
.menubar-add input { width: 100%; height: 32px; border: 0; outline: none; background: var(--bg-secondary); border-radius: 8px; padding: 0 10px; color: var(--text-primary); }
.menubar-footer { border-top: 1px solid var(--border-light); border-bottom: 0; }
.menubar-footer button { border: 0; background: transparent; color: var(--accent-blue); font-weight: 650; cursor: pointer; }
</style>
