<template>
  <section class="flex min-h-0 flex-1 flex-col px-3 pb-2 pt-0">
    <Transition name="create-panel">
      <QuickInput
        v-if="creating"
        :template="createTemplate"
        @close="emit('cancel-create')"
        @created="emit('created', $event)"
        @error="emit('error', $event)"
      />
    </Transition>

    <div v-if="displayedTasks.length === 0 && !creating" class="empty-state">
      <div class="empty-icon">{{ emptyIcon }}</div>
      <div class="empty-text">{{ emptyText }}</div>
      <div v-if="showStarterTemplates" class="starter-templates">
        <p>可以从一个模板开始：</p>
        <button
          v-for="template in starterTemplates"
          :key="template.key"
          type="button"
          class="starter-template"
          @click="onStarterTemplate(template)"
        >
          <span class="starter-template__icon">{{ template.icon }}</span>
          <span>
            <strong>{{ template.title }}</strong>
            <small>{{ template.description }}</small>
          </span>
          <span class="starter-template__arrow">›</span>
        </button>
      </div>
    </div>

    <div v-else class="task-list">
      <div
        v-for="group in groupedTasks"
        :key="group.key"
        class="task-group"
        :class="{ 'drag-over': draggingTaskId && dragOverGroup === group.key && group.droppable }"
        @dragover.prevent="group.droppable && onGroupDragOver(group.key)"
        @drop.prevent="group.droppable && onDropOnGroup(group.priority)"
      >
        <div class="task-group__header">
          <span>{{ group.label }}</span>
          <span>{{ group.tasks.length }}</span>
        </div>
        <div
          v-for="task in group.tasks"
          :key="task.record_id"
          draggable="true"
          class="task-draggable"
          :class="{
            dragging: draggingTaskId === task.record_id,
            'drop-before': dragOverTaskId === task.record_id && dragOverPlacement === 'before',
            'drop-after': dragOverTaskId === task.record_id && dragOverPlacement === 'after'
          }"
          @dragstart="onDragStart(task, $event)"
          @dragend="onDragEnd"
          @dragover.prevent.stop="group.droppable && onTaskDragOver(group.key, task.record_id, $event)"
          @drop.prevent.stop="group.droppable && onDropOnTask(group.priority, task.record_id)"
        >
          <TaskItem
            :ref="(el) => setTaskItemRef(task.record_id, el)"
            :task="task"
            :mode="mode"
            :focused="focusedTaskId === task.record_id"
            :status-sync="statusSyncState[task.record_id] || 'idle'"
            :notes-sync="notesSyncState[task.record_id] || 'idle'"
            @error="emit('error', $event)"
            @focus="setFocusedTask"
            @request-delete="emit('request-delete', $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import type { SyncState } from '../stores/taskStore';
import type { RecurrenceRule, Task } from '../types';
import QuickInput from './QuickInput.vue';
import TaskItem from './TaskItem.vue';

interface QuickTaskTemplate {
  name: string;
  priority?: string;
  dueDate?: string;
  dueTime?: string;
  recurrenceRule?: RecurrenceRule | null;
  reminderBefore?: number | null;
  notes?: string;
  expand?: 'priority' | 'date' | 'repeat' | 'reminder' | null;
}

interface CreatedTaskPayload {
  recordId: string;
  name: string;
  dueDate: string;
  reminderBefore: number | null;
}

const props = defineProps<{
  mode: 'local' | 'feishu';
  creating: boolean;
  createTemplate?: QuickTaskTemplate | null;
  statusSyncState: Record<string, SyncState>;
  notesSyncState: Record<string, SyncState>;
}>();

const emit = defineEmits<{
  (event: 'cancel-create'): void;
  (event: 'created', payload: CreatedTaskPayload): void;
  (event: 'error', message: string): void;
  (event: 'request-delete', task: Task): void;
  (event: 'create-template', template: QuickTaskTemplate): void;
  (event: 'create-habit-template'): void;
}>();

const store = useTaskStore();
const displayedTasks = computed(() => store.filteredTasks);
const focusedTaskId = ref<string>('');
const draggingTaskId = ref('');
const dragOverGroup = ref('');
const dragOverTaskId = ref('');
const dragOverPlacement = ref<'before' | 'after'>('before');
const itemRefs = new Map<string, any>();

const starterTemplates = computed(() => [
  {
    key: 'follow-up',
    icon: '📌',
    title: '明天跟进重要事项',
    description: '重要 · 明天 10:00',
    template: {
      name: '明天跟进重要事项',
      priority: '重要',
      dueDate: offsetDateKey(1),
      dueTime: '10:00',
      reminderBefore: null,
      expand: null
    } satisfies QuickTaskTemplate
  },
  {
    key: 'weekly-report',
    icon: '↻',
    title: '每周五写周报',
    description: '重复 · 周五 18:00',
    template: {
      name: '每周五写周报',
      priority: '普通',
      dueDate: thisFridayKey(),
      dueTime: '18:00',
      recurrenceRule: { type: 'weekly', interval: 1, daysOfWeek: [5] },
      reminderBefore: 0,
      expand: null
    } satisfies QuickTaskTemplate
  },
  {
    key: 'habit-water',
    icon: '🎯',
    title: '每天喝水',
    description: '习惯模板 · 去习惯页创建',
    template: null
  }
]);

const priorityGroups = [
  { key: 'urgent', priority: '紧急', label: '紧急' },
  { key: 'important', priority: '重要', label: '重要' },
  { key: 'normal', priority: '普通', label: '普通' }
];

const groupedTasks = computed(() => {
  const groups = priorityGroups
    .map((group) => ({
      ...group,
      droppable: true,
      tasks: displayedTasks.value.filter(
        (task) => normalizeTaskStatus(task.status) !== 'completed' && normalizePriority(task.priority) === group.priority
      )
    }))
    .filter((group) => group.tasks.length > 0 || store.filter !== 'done');

  const completed = displayedTasks.value.filter((task) => normalizeTaskStatus(task.status) === 'completed');
  if (completed.length > 0 || store.filter === 'done') {
    groups.push({ key: 'completed', priority: '普通', label: '已完成', droppable: false, tasks: completed });
  }
  return groups;
});

function normalizePriority(priority: string): string {
  const value = (priority || '').trim();
  if (['紧急', '今日必做', '🔴今日必做', '🔴 今日必做'].includes(value)) return '紧急';
  if (['重要', '本周完成', '🟡本周完成', '🟠本周完成', '🔵本周完成', '🟡尽快完成', '🟡重要不紧急'].includes(value)) return '重要';
  return '普通';
}

function normalizeTaskStatus(status: string): 'todo' | 'in_progress' | 'completed' | 'unknown' {
  const value = status.trim();
  if (value.includes('进行中')) return 'in_progress';
  if (value.includes('已完成')) return 'completed';
  if (value.includes('待处理') || value.includes('待办') || value.includes('待启动')) return 'todo';
  return 'unknown';
}

const emptyIcon = computed(() => {
  if (store.filter === 'done') return '🎉';
  if (store.filter === 'in_progress') return '🚀';
  return '☕';
});

const emptyText = computed(() => {
  if (store.hasActiveSearch) return '没有匹配的任务';
  if (store.filter === 'done') return '还没有已完成的任务';
  if (store.filter === 'pending') return '待启动任务已清空';
  if (store.filter === 'in_progress') return '还没有进行中的任务';
  return '今日无事，享受片刻';
});

const showStarterTemplates = computed(() => !store.hasActiveSearch && store.totalTaskCount === 0 && store.filter !== 'done');

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function offsetDateKey(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function thisFridayKey(): string {
  const date = new Date();
  const day = date.getDay();
  const distance = (5 - day + 7) % 7;
  date.setDate(date.getDate() + distance);
  return dateKey(date);
}

function onStarterTemplate(item: { key: string; template: QuickTaskTemplate | null }) {
  if (item.key === 'habit-water') {
    emit('create-habit-template');
    return;
  }
  if (item.template) emit('create-template', item.template);
}

function setTaskItemRef(recordId: string, el: any | null) {
  if (!el) {
    itemRefs.delete(recordId);
    return;
  }
  itemRefs.set(recordId, el);
}

function setFocusedTask(recordId: string) {
  focusedTaskId.value = recordId;
}

function ensureFocusedTask() {
  if (displayedTasks.value.length === 0) {
    focusedTaskId.value = '';
    return;
  }
  const exists = displayedTasks.value.some((task) => task.record_id === focusedTaskId.value);
  if (!exists) {
    focusedTaskId.value = displayedTasks.value[0].record_id;
  }
}

function moveFocus(step: number) {
  if (displayedTasks.value.length === 0) return;
  const currentIndex = displayedTasks.value.findIndex((task) => task.record_id === focusedTaskId.value);
  const base = currentIndex >= 0 ? currentIndex : 0;
  const next = (base + step + displayedTasks.value.length) % displayedTasks.value.length;
  focusedTaskId.value = displayedTasks.value[next].record_id;
}

async function toggleFocusedExpand() {
  if (!focusedTaskId.value) return;
  itemRefs.get(focusedTaskId.value)?.toggleExpandFromKeyboard?.();
}

async function toggleFocusedStatus() {
  if (!focusedTaskId.value) return;
  await itemRefs.get(focusedTaskId.value)?.toggleStatusFromKeyboard?.();
}

function requestDeleteFocused() {
  if (!focusedTaskId.value) return;
  itemRefs.get(focusedTaskId.value)?.requestDeleteFromKeyboard?.();
}

async function openTask(recordId: string) {
  focusedTaskId.value = recordId;
  await nextTick();
  itemRefs.get(recordId)?.openFromReminder?.();
}

function onDragStart(task: Task, event: DragEvent) {
  if (normalizeTaskStatus(task.status) === 'completed') {
    event.preventDefault();
    return;
  }
  draggingTaskId.value = task.record_id;
  event.dataTransfer?.setData('text/plain', task.record_id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function onDragEnd() {
  draggingTaskId.value = '';
  dragOverGroup.value = '';
  dragOverTaskId.value = '';
  dragOverPlacement.value = 'before';
}

function onGroupDragOver(groupKey: string) {
  dragOverGroup.value = groupKey;
  dragOverTaskId.value = '';
}

function onTaskDragOver(groupKey: string, recordId: string, event: DragEvent) {
  dragOverGroup.value = groupKey;
  dragOverTaskId.value = recordId;
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) {
    dragOverPlacement.value = 'before';
    return;
  }
  const rect = target.getBoundingClientRect();
  dragOverPlacement.value = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
}

async function onDropOnGroup(priority: string) {
  if (!draggingTaskId.value) return;
  try {
    await store.reorderTask(draggingTaskId.value, priority, '', 'end');
  } catch (error) {
    emit('error', `排序失败：${String(error)}`);
  } finally {
    onDragEnd();
  }
}

async function onDropOnTask(priority: string, beforeRecordId: string) {
  if (!draggingTaskId.value) {
    onDragEnd();
    return;
  }
  const placement = dragOverTaskId.value === beforeRecordId ? dragOverPlacement.value : 'before';
  if (draggingTaskId.value === beforeRecordId) {
    onDragEnd();
    return;
  }
  try {
    await store.reorderTask(draggingTaskId.value, priority, beforeRecordId, placement);
  } catch (error) {
    emit('error', `排序失败：${String(error)}`);
  } finally {
    onDragEnd();
  }
}

function clearFocus() {
  focusedTaskId.value = '';
}

function hasTasks() {
  return displayedTasks.value.length > 0;
}

defineExpose({
  moveFocus,
  toggleFocusedExpand,
  toggleFocusedStatus,
  requestDeleteFocused,
  openTask,
  clearFocus,
  hasTasks
});

watch(
  () => displayedTasks.value.map((task) => task.record_id).join(','),
  () => {
    ensureFocusedTask();
    nextTick(() => {
      // keep focus ring in sync
    });
  },
  { immediate: true }
);
</script>

<style scoped>
.create-panel-enter-active {
  transition: max-height 0.2s ease-out, opacity 0.2s ease-out, transform 0.2s ease-out;
}

.create-panel-leave-active {
  transition: max-height 0.15s ease-in, opacity 0.15s ease-in, transform 0.15s ease-in;
}

.create-panel-enter-from,
.create-panel-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.create-panel-enter-to,
.create-panel-leave-from {
  max-height: 520px;
  opacity: 1;
  transform: translateY(0);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.7;
}

.empty-text {
  font-size: var(--font-size-md);
  font-weight: 400;
  color: var(--text-secondary);
}

.starter-templates {
  width: min(100%, 320px);
  margin-top: 18px;
  display: grid;
  gap: 8px;
}

.starter-templates p {
  margin: 0 0 2px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.starter-template {
  min-height: 54px;
  padding: 9px 12px;
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 10px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
  border-radius: 14px;
  background: var(--bg-solid);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.starter-template:hover {
  border-color: color-mix(in srgb, var(--primary) 42%, var(--border));
  background: color-mix(in srgb, var(--primary) 5%, var(--bg-solid));
  transform: translateY(-1px);
}

.starter-template__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--bg-secondary);
  font-size: 16px;
}

.starter-template strong {
  display: block;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.2;
}

.starter-template small {
  display: block;
  margin-top: 3px;
  color: var(--text-tertiary);
  font-size: 11px;
  line-height: 1.2;
}

.starter-template__arrow {
  color: var(--text-tertiary);
  font-size: 18px;
}

.task-list {
  flex: 1;
  padding: 0 0 10px;
}

.task-group {
  margin-top: 8px;
  border-radius: var(--radius-card);
}

.task-group.drag-over {
  background: color-mix(in srgb, var(--primary) 6%, transparent);
}

.task-group__header {
  margin: 10px 12px 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.task-draggable.dragging {
  opacity: 0.55;
}

.task-draggable {
  position: relative;
}

.task-draggable.drop-before::before,
.task-draggable.drop-after::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  z-index: 2;
  height: 2px;
  border-radius: 999px;
  background: var(--primary);
}

.task-draggable.drop-before::before {
  top: 0;
}

.task-draggable.drop-after::after {
  bottom: 0;
}
</style>
