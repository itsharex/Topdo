<template>
  <div ref="panelRef" class="quick-input">
    <div class="create-header">
      <button type="button" class="header-action header-action--muted" @click="handleCancel">取消</button>
      <strong>新建任务</strong>
      <button type="button" class="header-action header-action--primary" :disabled="!taskName.trim() || submitting" @click="handleCreate">创建</button>
    </div>

    <div class="quick-input__body task-scrollbar">
      <div class="task-input-area">
        <input
          ref="inputRef"
          v-model="taskName"
          class="task-input"
          placeholder="输入任务名称，按回车创建..."
          @keydown.enter.prevent="handleCreate"
          @keydown.esc.prevent="handleCancel"
        />
        <div class="input-divider" aria-hidden="true"></div>
      </div>

      <div class="options-panel">
        <section class="option-row">
          <div class="option-icon option-icon--blue"><Icon name="priority" :size="17" /></div>
          <div class="option-content">
            <span class="option-label">优先级</span>
            <ChipSelector v-model="selectedPriority" :options="priorityOptions" tone="blue" />
          </div>
        </section>

        <section class="option-row option-row--stack">
          <div class="option-icon option-icon--green"><Icon name="calendar" :size="17" /></div>
          <div class="option-content">
            <span class="option-label">日期</span>
            <ChipSelector :model-value="selectedDateOption" :options="dateOptions" tone="blue" @update:model-value="onDateOptionUpdate" />
            <div v-if="selectedDateOption === 'custom'" class="custom-date-row">
              <input v-model="customDueDate" class="date-input" type="date" @change="onCustomDateChange" />
              <button v-if="selectedDueDate" type="button" class="clear-date" @click="clearDueDate">清除日期</button>
            </div>
          </div>
        </section>

        <section v-if="selectedDueDate" class="option-row">
          <div class="option-icon option-icon--orange"><Icon name="clock" :size="17" /></div>
          <div class="option-content option-content--inline">
            <span class="option-label">时间</span>
            <input v-model="selectedDueTime" class="time-input" type="time" />
            <span class="option-hint">不填则当天 23:59 到期</span>
          </div>
        </section>

        <section class="option-row option-row--stack">
          <div class="option-icon option-icon--purple"><Icon name="recurring" :size="17" /></div>
          <div class="option-content">
            <span class="option-label">重复</span>
            <RecurrencePanel v-model="selectedRecurrenceRule" embedded />
          </div>
        </section>

        <section class="option-row option-row--stack">
          <div class="option-icon option-icon--amber"><Icon name="bell" :size="17" /></div>
          <div class="option-content">
            <span class="option-label">提醒</span>
            <ReminderSelect v-model="selectedReminderBefore" embedded />
          </div>
        </section>

        <section class="option-row option-row--stack">
          <div class="option-icon option-icon--slate"><Icon name="list" :size="17" /></div>
          <div class="option-content">
            <span class="option-label">子任务</span>
            <div class="subtask-section">
              <ul v-if="subTasks.length" class="subtask-list">
                <li v-for="item in subTasks" :key="item.id" class="subtask-item">
                  <span class="subtask-checkbox" aria-hidden="true"></span>
                  <input
                    v-model="item.text"
                    class="subtask-text-input"
                    placeholder="子任务名称"
                    @keydown.enter.prevent="addSubTask"
                  />
                  <button type="button" class="subtask-delete" title="删除子任务" @click="removeSubTask(item.id)">×</button>
                </li>
              </ul>
              <button type="button" class="subtask-add" @click="addSubTask">
                <span class="subtask-add-icon">+</span>
                <span class="subtask-add-text">添加子任务，回车确认</span>
              </button>
            </div>
          </div>
        </section>

        <section class="option-row option-row--stack option-row--no-border">
          <div class="option-icon option-icon--cyan"><Icon name="file-text" :size="17" /></div>
          <div class="option-content">
            <span class="option-label">备注</span>
            <textarea v-model="note" class="note-textarea" placeholder="添加备注或收获..." rows="3"></textarea>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import type { RecurrenceRule, SubTask } from '../types';
import { buildDueDateValue } from '../utils/dueDate';
import Icon from './Icon.vue';
import RecurrencePanel from './RecurrencePanel.vue';
import ReminderSelect from './ReminderSelect.vue';
import ChipSelector, { type ChipOption } from './ui/ChipSelector.vue';

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'created'): void;
  (event: 'error', message: string): void;
}>();

const taskStore = useTaskStore();

const panelRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const taskName = ref('');
const selectedPriority = ref('普通');
const selectedDateOption = ref<string | number | null>(null);
const selectedDueDate = ref('');
const customDueDate = ref('');
const selectedDueTime = ref('');
const selectedRecurrenceRule = ref<RecurrenceRule | null>(null);
const selectedReminderBefore = ref<number | null>(null);
const subTasks = ref<SubTask[]>([]);
const note = ref('');
const submitting = ref(false);

const priorityOptions: ChipOption[] = [
  { value: '普通', label: '普通', dot: '#94A3B8' },
  { value: '重要', label: '重要', dot: '#2563EB' },
  { value: '紧急', label: '紧急', dot: '#EF4444' }
];

const dateOptions: ChipOption[] = [
  { value: todayKey(), label: '今天' },
  { value: offsetDateKey(1), label: '明天' },
  { value: thisFridayKey(), label: '本周五' },
  { value: nextMondayKey(), label: '下周一' },
  { value: 'custom', label: '选择日期' }
];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayKey(): string {
  return dateKey(new Date());
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

function nextMondayKey(): string {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() + (8 - day));
  return dateKey(date);
}

function reset() {
  taskName.value = '';
  selectedPriority.value = '普通';
  selectedDateOption.value = null;
  selectedDueDate.value = '';
  customDueDate.value = '';
  selectedDueTime.value = '';
  selectedRecurrenceRule.value = null;
  selectedReminderBefore.value = null;
  subTasks.value = [];
  note.value = '';
}

function onDateOptionUpdate(value: string | number | null) {
  if (value === 'custom') {
    selectedDateOption.value = 'custom';
    customDueDate.value = customDueDate.value || todayKey();
    selectedDueDate.value = customDueDate.value;
    return;
  }

  if (typeof value === 'string') {
    selectedDateOption.value = value;
    selectedDueDate.value = value;
    customDueDate.value = '';
  }
}

function onCustomDateChange() {
  selectedDueDate.value = customDueDate.value;
}

function clearDueDate() {
  selectedDateOption.value = null;
  selectedDueDate.value = '';
  customDueDate.value = '';
  selectedDueTime.value = '';
}

function newSubTask(text = ''): SubTask {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    done: false,
    created_at: Math.floor(Date.now() / 1000).toString()
  };
}

function addSubTask() {
  const last = subTasks.value[subTasks.value.length - 1];
  if (last && !last.text.trim()) return;
  subTasks.value.push(newSubTask());
  nextTick(() => {
    const inputs = panelRef.value?.querySelectorAll<HTMLInputElement>('.subtask-text-input');
    inputs?.[inputs.length - 1]?.focus();
  });
}

function removeSubTask(id: string) {
  subTasks.value = subTasks.value.filter((item) => item.id !== id);
}

async function handleCreate() {
  const name = taskName.value.trim();
  if (!name || submitting.value) return;

  const payload = {
    name,
    priority: selectedPriority.value,
    status: '待处理',
    due_date: buildDueDateValue(selectedDueDate.value, selectedDueTime.value),
    notes: note.value.trim(),
    sub_tasks: subTasks.value.filter((item) => item.text.trim()).map((item) => ({ ...item, text: item.text.trim() })),
    recurrence_rule: selectedRecurrenceRule.value,
    reminder_before: selectedReminderBefore.value
  };

  submitting.value = true;
  reset();
  emit('created');
  emit('close');

  try {
    await taskStore.createTask(payload);
  } catch (error) {
    emit('error', `创建任务失败：${String(error)}`);
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  reset();
  emit('close');
}

function onGlobalMouseDown(event: MouseEvent) {
  const target = event.target as Node | null;
  if (!target || !panelRef.value) return;
  if (!panelRef.value.contains(target)) {
    handleCancel();
  }
}

onMounted(() => {
  nextTick(() => inputRef.value?.focus());
  document.addEventListener('mousedown', onGlobalMouseDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onGlobalMouseDown);
});
</script>

<style scoped>
.quick-input {
  margin: 8px 12px 10px;
  max-height: min(520px, calc(100vh - 126px));
  display: flex;
  flex-direction: column;
  font-size: 14px;
  overflow: hidden;
  background: var(--bg-solid);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.12);
}

.create-header {
  height: 48px;
  padding: 0 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light);
}

.create-header strong {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.header-action {
  border: 0;
  background: transparent;
  font-family: var(--font-family);
  font-size: 14px;
  cursor: pointer;
}

.header-action--muted {
  color: var(--text-secondary);
}

.header-action--primary {
  color: var(--accent-blue);
  font-weight: 700;
}

.header-action:disabled {
  color: var(--text-placeholder);
  cursor: not-allowed;
}

.quick-input__body {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px 16px;
}

.task-input-area {
  margin-bottom: 20px;
}

.task-input {
  width: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.35;
}

.task-input::placeholder {
  color: var(--text-placeholder);
  font-weight: 500;
}

.input-divider {
  height: 2px;
  margin-top: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-blue-light));
}

.options-panel {
  display: grid;
}

.option-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid var(--border-light);
}

.option-row:last-child {
  border-bottom: 0;
}

.option-row--no-border {
  border-bottom: 0;
}

.option-icon {
  width: 32px;
  height: 32px;
  margin-top: 1px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 9px;
}

.option-icon--blue { color: var(--accent-blue); background: var(--accent-blue-soft); }
.option-icon--green { color: var(--accent-green); background: var(--accent-green-soft); }
.option-icon--orange { color: var(--accent-amber); background: var(--accent-amber-soft); }
.option-icon--purple { color: var(--accent-purple); background: var(--accent-purple-soft); }
.option-icon--amber { color: var(--accent-amber); background: var(--accent-amber-soft); }
.option-icon--slate { color: var(--accent-slate); background: var(--accent-slate-soft); }
.option-icon--cyan { color: var(--accent-cyan); background: var(--accent-cyan-soft); }

.option-content {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 10px;
}

.option-content--inline {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.quick-input :deep(.chip-selector) {
  flex-wrap: nowrap;
  gap: 8px;
}

.quick-input :deep(.chip-selector__item) {
  min-height: 28px;
  padding: 5px 12px;
  white-space: nowrap;
  font-size: 13px;
}

.quick-input :deep(.chip-selector--compact .chip-selector__item) {
  min-height: 26px;
  padding: 5px 11px;
  font-size: 12px;
}

.custom-date-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.date-input,
.time-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-solid);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 14px;
  outline: none;
}

.date-input:focus,
.time-input:focus {
  border-color: var(--accent-blue);
  box-shadow: var(--shadow-focus);
}

.time-input {
  width: 96px;
  text-align: center;
}

.clear-date {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 12px;
  cursor: pointer;
}

.option-hint {
  color: var(--text-tertiary);
  font-size: 11px;
  line-height: 1.2;
}

.subtask-section {
  margin-top: 2px;
}

.subtask-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
}

.subtask-item:last-child {
  border-bottom: 0;
}

.subtask-checkbox {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1.5px solid var(--text-placeholder);
}

.subtask-text-input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 14px;
}

.subtask-text-input::placeholder {
  color: var(--text-tertiary);
}

.subtask-delete {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 14px;
  line-height: 1;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.subtask-item:hover .subtask-delete {
  opacity: 1;
}

.subtask-delete:hover {
  color: var(--accent-red);
  background: var(--accent-red-soft);
}

.subtask-add {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  font-family: var(--font-family);
  cursor: pointer;
}

.subtask-add-icon {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1.5px dashed var(--text-placeholder);
  font-size: 12px;
}

.subtask-add-text {
  font-size: 14px;
}

.subtask-add:hover {
  color: var(--accent-blue);
}

.subtask-add:hover .subtask-add-icon {
  border-color: var(--accent-blue);
}

.note-textarea {
  width: 100%;
  min-height: 72px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s ease;
}

.note-textarea:focus {
  border-color: var(--accent-blue);
}

.note-textarea::placeholder {
  color: var(--text-tertiary);
}
</style>
