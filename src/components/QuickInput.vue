<template>
  <div
    ref="panelRef"
    class="quick-input"
    @click.stop
    @mousedown.stop
    @dblclick.stop
    @keydown.stop
  >
    <div class="create-toolbar">
      <button type="button" class="toolbar-btn toolbar-btn--muted" @click="handleCancel">取消</button>
      <strong>新建任务</strong>
      <button type="button" class="toolbar-btn toolbar-btn--primary" :disabled="!taskName.trim() || submitting" @click="handleCreate">
        {{ submitting ? '创建中...' : '创建' }}
      </button>
    </div>

    <div class="quick-input__body task-scrollbar">
      <div class="task-input-area">
        <input
          ref="inputRef"
          v-model="taskName"
          class="task-input"
          placeholder="输入任务名称，⌘↵ 创建"
          @compositionstart="isTaskNameComposing = true"
          @compositionend="isTaskNameComposing = false"
          @keydown.enter="onTaskNameEnter"
          @keydown.esc.prevent="handleCancel"
        />
        <div class="input-divider" aria-hidden="true"></div>
      </div>

      <div class="accordion-panel">
        <section v-if="expandedOption !== 'priority'" class="opt-row" @click="toggleOption('priority')">
          <div class="opt-icon opt-icon--blue"><Icon name="priority" :size="13" /></div>
          <span class="opt-title">优先级</span>
          <span class="opt-value"><span class="value-dot" :style="{ background: prioritySummary.dot }"></span>{{ prioritySummary.label }}</span>
          <span class="opt-arrow">›</span>
        </section>
        <section v-else class="opt-expanded">
          <div class="opt-exp-header">
            <div class="opt-icon opt-icon--blue"><Icon name="priority" :size="13" /></div>
            <span class="opt-exp-title">优先级</span>
            <button type="button" class="opt-collapse" @click="expandedOption = null">收起 ‹</button>
          </div>
          <div class="opt-chips">
            <button
              v-for="option in priorityOptions"
              :key="option.value"
              type="button"
              class="chip"
              :class="[`chip--${option.tone}`, { selected: selectedPriority === option.value }]"
              @click="selectPriority(option.value)"
            >
              <span class="chip-dot" :style="{ background: option.dot }"></span>{{ option.label }}
            </button>
          </div>
        </section>

        <section v-if="expandedOption !== 'tags'" class="opt-row" @click="toggleOption('tags')">
          <div class="opt-icon opt-icon--cyan"><Icon name="tag" :size="13" /></div>
          <span class="opt-title">标签</span>
          <span class="opt-value">{{ tagsSummary }}</span>
          <span class="opt-arrow">›</span>
        </section>
        <section v-else class="opt-expanded">
          <div class="opt-exp-header">
            <div class="opt-icon opt-icon--cyan"><Icon name="tag" :size="13" /></div>
            <span class="opt-exp-title">标签</span>
            <button type="button" class="opt-collapse" @click="expandedOption = null">收起 ‹</button>
          </div>
          <div class="tag-picker">
            <button
              v-for="tag in tagOptions"
              :key="tag"
              type="button"
              class="tag-chip"
              :class="{ selected: selectedTags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
            <p v-if="!tagOptions.length" class="tag-empty-hint">输入后会保留最近 5 个标签</p>
          </div>
          <div class="tag-input-row">
            <input
              v-model="tagDraft"
              type="text"
              placeholder="自定义标签，回车添加"
              @compositionstart="isTagComposing = true"
              @compositionend="isTagComposing = false"
              @keydown.enter="onTagInputEnter"
            />
            <button type="button" @click="addTagDraft">添加</button>
          </div>
        </section>

        <section v-if="expandedOption !== 'date'" class="opt-row" @click="toggleOption('date')">
          <div class="opt-icon opt-icon--green"><Icon name="calendar" :size="13" /></div>
          <span class="opt-title">日期</span>
          <span class="opt-value">{{ dueDateSummary }}</span>
          <span class="opt-arrow">›</span>
        </section>
        <section v-else class="opt-expanded">
          <div class="opt-exp-header">
            <div class="opt-icon opt-icon--green"><Icon name="calendar" :size="13" /></div>
            <span class="opt-exp-title">日期</span>
            <button type="button" class="opt-collapse" @click="expandedOption = null">收起 ‹</button>
          </div>
          <div class="opt-chips">
            <button
              v-for="option in dateOptions"
              :key="String(option.value)"
              type="button"
              class="chip"
              :class="{ selected: selectedDateOption === option.value }"
              @click="onDateOptionUpdate(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="date-time-row">
            <span>时间</span>
            <input v-model="selectedDueTime" type="time" :disabled="!selectedDueDate" />
            <small>{{ selectedDueDate ? '默认 23:59' : '先选日期' }}</small>
          </div>
          <div class="calendar-box">
            <div class="calendar-head">
              <button type="button" @click="shiftCalendarMonth(-1)">‹</button>
              <strong>{{ calendarTitle }}</strong>
              <button type="button" @click="shiftCalendarMonth(1)">›</button>
            </div>
            <div class="calendar-grid">
              <span v-for="day in weekLabels" :key="day" class="calendar-week">{{ day }}</span>
              <button
                v-for="cell in calendarCells"
                :key="cell.key"
                type="button"
                class="calendar-day"
                :class="{ muted: !cell.inMonth, today: cell.date === todayKey(), selected: cell.date === selectedDueDate }"
                @click="selectCalendarDate(cell.date)"
              >
                {{ cell.day }}
              </button>
            </div>
          </div>
        </section>

        <section v-if="expandedOption !== 'repeat'" class="opt-row" @click="toggleOption('repeat')">
          <div class="opt-icon opt-icon--purple"><Icon name="recurring" :size="13" /></div>
          <span class="opt-title">重复</span>
          <span class="opt-value">{{ repeatSummary }}</span>
          <span class="opt-arrow">›</span>
        </section>
        <section v-else class="opt-expanded">
          <div class="opt-exp-header">
            <div class="opt-icon opt-icon--purple"><Icon name="recurring" :size="13" /></div>
            <span class="opt-exp-title">重复</span>
            <button type="button" class="opt-collapse" @click="expandedOption = null">收起 ‹</button>
          </div>
          <div class="opt-chips">
            <button
              v-for="option in repeatOptions"
              :key="String(option.value)"
              type="button"
              class="chip"
              :class="{ selected: repeatValue === option.value }"
              @click="selectRepeat(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <div v-if="repeatValue === 'weekly' || repeatValue === 'biweekly'" class="weekday-picker">
            <button
              v-for="day in weekdayOptions"
              :key="day.value"
              type="button"
              :class="{ selected: repeatDays.includes(day.value) }"
              @click="toggleRepeatDay(day.value)"
            >
              {{ day.label }}
            </button>
          </div>
        </section>

        <section v-if="expandedOption !== 'reminder'" class="opt-row" @click="toggleOption('reminder')">
          <div class="opt-icon opt-icon--orange"><Icon name="bell" :size="13" /></div>
          <span class="opt-title">提醒</span>
          <span class="opt-value">{{ reminderSummary }}</span>
          <span class="opt-arrow">›</span>
        </section>
        <section v-else class="opt-expanded">
          <div class="opt-exp-header">
            <div class="opt-icon opt-icon--orange"><Icon name="bell" :size="13" /></div>
            <span class="opt-exp-title">提醒</span>
            <button type="button" class="opt-collapse" @click="expandedOption = null">收起 ‹</button>
          </div>
          <div class="opt-chips">
            <button
              v-for="option in reminderOptions"
              :key="String(option.value)"
              type="button"
              class="chip"
              :class="{ selected: selectedReminderBefore === option.value }"
              @click="selectReminder(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </section>
      </div>

      <section class="sub-section">
        <div class="section-head">
          <div class="opt-icon opt-icon--gray"><Icon name="list" :size="13" /></div>
          <span>子任务</span>
        </div>
        <ul v-if="subTasks.length" class="sub-list">
          <li v-for="item in subTasks" :key="item.id" class="sub-item">
            <span class="sub-circle" aria-hidden="true"></span>
            <input
              v-model="item.text"
              class="sub-input"
              placeholder="子任务名称"
              @compositionstart="isSubTaskComposing = true"
              @compositionend="isSubTaskComposing = false"
              @keydown.enter="onSubTaskEnter"
            />
            <button type="button" class="sub-remove" title="删除子任务" @click="removeSubTask(item.id)">×</button>
          </li>
        </ul>
        <button type="button" class="sub-add" @click="addSubTask">+ 添加子任务</button>
      </section>

      <section class="note-section">
        <div class="section-head">
          <div class="opt-icon opt-icon--gray"><Icon name="file-text" :size="13" /></div>
          <span>备注</span>
        </div>
        <textarea v-model="note" class="note-textarea" placeholder="添加备注..." rows="2"></textarea>
      </section>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import type { RecurrenceRule, SubTask } from '../types';
import { buildDueDateValue } from '../utils/dueDate';
import { isImeComposing } from '../utils/keyboard';
import Icon from './Icon.vue';

type ExpandedOption = 'priority' | 'tags' | 'date' | 'repeat' | 'reminder' | null;
type RepeatValue = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

interface QuickInputTemplate {
  name: string;
  priority?: string;
  dueDate?: string;
  dueTime?: string;
  recurrenceRule?: RecurrenceRule | null;
  reminderBefore?: number | null;
  tags?: string[];
  notes?: string;
  expand?: ExpandedOption;
}

interface CreatedTaskPayload {
  recordId: string;
  name: string;
  dueDate: string;
  reminderBefore: number | null;
}

const props = defineProps<{
  template?: QuickInputTemplate | null;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'created', payload: CreatedTaskPayload): void;
  (event: 'error', message: string): void;
}>();

const taskStore = useTaskStore();

const panelRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const taskName = ref('');
const selectedPriority = ref('普通');
const selectedDateOption = ref<string | number | null>(null);
const selectedDueDate = ref('');
const selectedDueTime = ref('');
const selectedRecurrenceRule = ref<RecurrenceRule | null>(null);
const selectedReminderBefore = ref<number | null>(null);
const selectedTags = ref<string[]>([]);
const tagDraft = ref('');
const subTasks = ref<SubTask[]>([]);
const note = ref('');
const submitting = ref(false);
const expandedOption = ref<ExpandedOption>(null);
const calendarMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const isTaskNameComposing = ref(false);
const isTagComposing = ref(false);
const isSubTaskComposing = ref(false);

const priorityOptions = [
  { value: '普通', label: '普通', dot: '#8E8E93', tone: 'normal' },
  { value: '重要', label: '重要', dot: '#007AFF', tone: 'important' },
  { value: '紧急', label: '紧急', dot: '#FF3B30', tone: 'urgent' }
];

const dateOptions = [
  { value: todayKey(), label: '今天' },
  { value: offsetDateKey(1), label: '明天' },
  { value: thisFridayKey(), label: '周五' },
  { value: nextMondayKey(), label: '下周一' },
  { value: null, label: '无日期' }
];

const repeatOptions: Array<{ value: RepeatValue; label: string }> = [
  { value: 'none', label: '不重复' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'biweekly', label: '每两周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' }
];

const reminderOptions = [
  { value: null, label: '无' },
  { value: 0, label: '到期时' },
  { value: 30, label: '提前30分钟' },
  { value: 60, label: '提前1小时' },
  { value: 1440, label: '提前1天' }
];

const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];
const weekdayOptions = weekLabels.map((label, value) => ({ label, value }));

const prioritySummary = computed(() => priorityOptions.find((item) => item.value === selectedPriority.value) || priorityOptions[0]);
const tagOptions = computed(() => mergeTagOptions(taskStore.recentTags, selectedTags.value));
const tagsSummary = computed(() => selectedTags.value.length ? selectedTags.value.join('、') : '无');
const dueDateSummary = computed(() => {
  if (!selectedDueDate.value) return '无日期';
  const dateLabel = formatDueDateSummary(selectedDueDate.value);
  return selectedDueTime.value ? `${dateLabel} ${selectedDueTime.value}` : dateLabel;
});
const repeatValue = computed<RepeatValue>(() => {
  const rule = selectedRecurrenceRule.value;
  if (!rule) return 'none';
  if (rule.type === 'daily') return 'daily';
  if (rule.type === 'weekly' && rule.interval === 2) return 'biweekly';
  if (rule.type === 'weekly') return 'weekly';
  if (rule.type === 'monthly' && rule.interval === 12) return 'yearly';
  if (rule.type === 'monthly') return 'monthly';
  return 'weekly';
});
const repeatSummary = computed(() => repeatOptions.find((item) => item.value === repeatValue.value)?.label || '不重复');
const repeatDays = computed(() => {
  const days = selectedRecurrenceRule.value?.daysOfWeek || [];
  return days.length ? days : [new Date().getDay()];
});
const reminderSummary = computed(() => reminderOptions.find((item) => item.value === selectedReminderBefore.value)?.label || '无');
const calendarTitle = computed(() => `${calendarMonth.value.getFullYear()}年 ${calendarMonth.value.getMonth() + 1}月`);
const calendarCells = computed(() => {
  const first = calendarMonth.value;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      key: dateKey(date),
      date: dateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === first.getMonth()
    };
  });
});

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

function formatDueDateSummary(value: string): string {
  if (value === todayKey()) return '今天';
  if (value === offsetDateKey(1)) return '明天';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function toggleOption(option: Exclude<ExpandedOption, null>) {
  expandedOption.value = expandedOption.value === option ? null : option;
}

function selectPriority(value: string) {
  selectedPriority.value = value;
  expandedOption.value = null;
}

function normalizeTag(value: string): string {
  return value.trim().replace(/^#/, '').slice(0, 16);
}

function mergeTagOptions(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const tag of groups.flat()) {
    const normalized = normalizeTag(tag);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(normalized);
    if (options.length >= 5) break;
  }
  return options;
}

function addTag(value: string) {
  const tag = normalizeTag(value);
  if (!tag) return;
  if (selectedTags.value.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
  if (selectedTags.value.length >= 5) return;
  selectedTags.value = [...selectedTags.value, tag].slice(0, 5);
}

function addTagDraft() {
  tagDraft.value
    .split(/[，,\s]+/)
    .forEach((tag) => addTag(tag));
  tagDraft.value = '';
}

function toggleTag(tag: string) {
  if (selectedTags.value.includes(tag)) {
    removeTag(tag);
    return;
  }
  addTag(tag);
}

function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter((item) => item !== tag);
}

function onTagInputEnter(event: KeyboardEvent) {
  if (isImeComposing(event, isTagComposing.value)) return;
  event.preventDefault();
  addTagDraft();
}

function onDateOptionUpdate(value: string | number | null) {
  if (typeof value === 'string') {
    selectedDateOption.value = value;
    selectedDueDate.value = value;
    selectedDueTime.value = selectedDueTime.value || '23:59';
    calendarMonth.value = new Date(`${value}T00:00:00`);
    return;
  }
  selectedDateOption.value = null;
  selectedDueDate.value = '';
  selectedDueTime.value = '';
}

function selectCalendarDate(value: string) {
  selectedDateOption.value = value;
  selectedDueDate.value = value;
  selectedDueTime.value = selectedDueTime.value || '23:59';
  expandedOption.value = null;
}

function shiftCalendarMonth(offset: number) {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + offset, 1);
}

function selectRepeat(value: RepeatValue) {
  if (value === 'none') selectedRecurrenceRule.value = null;
  if (value === 'daily') selectedRecurrenceRule.value = { type: 'daily', interval: 1 };
  if (value === 'weekly') selectedRecurrenceRule.value = { type: 'weekly', interval: 1, daysOfWeek: [new Date().getDay()] };
  if (value === 'biweekly') selectedRecurrenceRule.value = { type: 'weekly', interval: 2, daysOfWeek: [new Date().getDay()] };
  if (value === 'monthly') selectedRecurrenceRule.value = { type: 'monthly', interval: 1, dayOfMonth: new Date().getDate() };
  if (value === 'yearly') selectedRecurrenceRule.value = { type: 'monthly', interval: 12, dayOfMonth: new Date().getDate() };
  if (value !== 'weekly' && value !== 'biweekly') {
    expandedOption.value = null;
  }
}

function toggleRepeatDay(day: number) {
  const rule = selectedRecurrenceRule.value;
  if (!rule || rule.type !== 'weekly') return;
  const selected = new Set(repeatDays.value);
  if (selected.has(day)) {
    if (selected.size === 1) return;
    selected.delete(day);
  } else {
    selected.add(day);
  }
  selectedRecurrenceRule.value = {
    ...rule,
    daysOfWeek: Array.from(selected).sort()
  };
}

function selectReminder(value: number | null) {
  selectedReminderBefore.value = value;
  expandedOption.value = null;
}

function reset() {
  taskName.value = '';
  selectedPriority.value = '普通';
  selectedTags.value = [];
  tagDraft.value = '';
  selectedDateOption.value = null;
  selectedDueDate.value = '';
  selectedDueTime.value = '';
  selectedRecurrenceRule.value = null;
  selectedReminderBefore.value = null;
  subTasks.value = [];
  note.value = '';
  expandedOption.value = null;
}

function applyTemplate(template: QuickInputTemplate | null | undefined) {
  if (!template) return;
  taskName.value = template.name || '';
  selectedPriority.value = template.priority || '普通';
  selectedTags.value = [...(template.tags || [])];
  tagDraft.value = '';
  selectedDueDate.value = template.dueDate || '';
  selectedDateOption.value = template.dueDate || null;
  selectedDueTime.value = template.dueDate ? (template.dueTime || '23:59') : '';
  selectedRecurrenceRule.value = template.recurrenceRule ? JSON.parse(JSON.stringify(template.recurrenceRule)) : null;
  selectedReminderBefore.value = template.reminderBefore ?? null;
  note.value = template.notes || '';
  expandedOption.value = template.expand ?? null;
  if (template.dueDate) {
    const date = new Date(`${template.dueDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      calendarMonth.value = new Date(date.getFullYear(), date.getMonth(), 1);
    }
  }
  void nextTick(() => inputRef.value?.focus());
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
    const inputs = panelRef.value?.querySelectorAll<HTMLInputElement>('.sub-input');
    inputs?.[inputs.length - 1]?.focus();
  });
}

function removeSubTask(id: string) {
  subTasks.value = subTasks.value.filter((item) => item.id !== id);
}

function onTaskNameEnter(event: KeyboardEvent) {
  event.stopPropagation();
  if (isImeComposing(event, isTaskNameComposing.value)) return;
  if (!event.metaKey) return;
  event.preventDefault();
  void handleCreate();
}

function onSubTaskEnter(event: KeyboardEvent) {
  if (isImeComposing(event, isSubTaskComposing.value)) return;
  event.preventDefault();
  addSubTask();
}

async function handleCreate() {
  const name = taskName.value.trim();
  if (!name || submitting.value) return;
  addTagDraft();
  const dueDate = buildDueDateValue(selectedDueDate.value, selectedDueTime.value);

  const payload = {
    name,
    priority: selectedPriority.value,
    status: '待处理',
    due_date: dueDate,
    notes: note.value.trim(),
    sub_tasks: subTasks.value.filter((item) => item.text.trim()).map((item) => ({ ...item, text: item.text.trim() })),
    tags: selectedTags.value,
    recurrence_rule: selectedRecurrenceRule.value,
    reminder_before: selectedReminderBefore.value
  };

  submitting.value = true;

  try {
    const reminderBefore = selectedReminderBefore.value;
    const recordId = await taskStore.createTask(payload);
    reset();
    emit('created', {
      recordId,
      name,
      dueDate,
      reminderBefore
    });
    emit('close');
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
  applyTemplate(props.template);
  nextTick(() => inputRef.value?.focus());
  document.addEventListener('mousedown', onGlobalMouseDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onGlobalMouseDown);
});

watch(
  () => props.template,
  (template) => applyTemplate(template),
  { deep: true }
);
</script>

<style scoped>
.quick-input {
  margin: 8px 12px 10px;
  max-height: min(520px, calc(100vh - 126px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-solid);
  border: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.create-toolbar {
  height: 42px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-light);
}

.create-toolbar strong {
  font-size: 14px;
  font-weight: 650;
  color: var(--text-primary);
}

.toolbar-btn {
  border: 0;
  background: transparent;
  font-family: var(--font-family);
  font-size: 13px;
  cursor: pointer;
}

.toolbar-btn--muted { color: var(--text-secondary); }
.toolbar-btn--primary { color: var(--primary); font-weight: 600; }
.toolbar-btn:disabled { color: var(--text-placeholder); cursor: not-allowed; }

.quick-input__body {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px 10px;
}

.task-input-area {
  margin-bottom: 12px;
}

.task-input {
  width: 100%;
  padding: 4px 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 15px;
  line-height: 1.35;
}

.task-input::placeholder {
  color: var(--text-placeholder);
}

.input-divider {
  height: 2px;
  margin-top: 4px;
  border-radius: 1px;
  background: var(--primary);
}

.opt-row,
.opt-expanded {
  border-bottom: 1px solid var(--border-light);
}

.opt-row {
  min-height: 44px;
  padding: 9px 0;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.opt-expanded {
  padding: 10px 0;
  animation: option-open 0.18s ease;
}

@keyframes option-open {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: translateY(0); }
}

.opt-icon {
  width: 26px;
  height: 26px;
  margin-right: 10px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 13px;
}

.opt-icon--blue { color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, var(--bg-solid)); }
.opt-icon--green { color: var(--accent-green); background: var(--accent-green-soft); }
.opt-icon--purple { color: var(--accent-purple); background: var(--accent-purple-soft); }
.opt-icon--orange { color: var(--accent-amber); background: var(--accent-amber-soft); }
.opt-icon--cyan { color: var(--accent-cyan); background: var(--accent-cyan-soft); }
.opt-icon--gray { color: var(--text-tertiary); background: var(--bg-secondary); }

.opt-title {
  flex: 1;
  color: var(--text-primary);
  font-size: 13px;
}

.opt-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.value-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.opt-arrow {
  margin-left: 4px;
  color: var(--text-placeholder);
  font-size: 12px;
}

.opt-exp-header {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.opt-exp-title {
  flex: 1;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.opt-collapse {
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 11px;
  cursor: pointer;
}

.opt-chips {
  padding-left: 36px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.weekday-picker {
  margin: 8px 0 0 36px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.weekday-picker button {
  width: 25px;
  height: 25px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.weekday-picker button.selected {
  color: var(--accent-purple);
  border-color: color-mix(in srgb, var(--accent-purple) 65%, var(--border));
  background: color-mix(in srgb, var(--accent-purple) 12%, var(--bg-solid));
}

.chip {
  padding: 4px 9px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.12s ease;
}

.chip:hover { border-color: color-mix(in srgb, var(--text-secondary) 34%, var(--border)); }
.chip.selected { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, var(--bg-solid)); color: var(--primary); font-weight: 600; }
.chip--urgent.selected { border-color: var(--priority-high); color: var(--priority-high); background: color-mix(in srgb, var(--priority-high) 9%, var(--bg-solid)); }
.chip--important.selected { border-color: var(--priority-medium); color: var(--priority-medium); background: color-mix(in srgb, var(--priority-medium) 9%, var(--bg-solid)); }
.chip--normal.selected { border-color: var(--text-tertiary); color: var(--text-secondary); background: color-mix(in srgb, var(--text-tertiary) 10%, var(--bg-solid)); }

.chip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.tag-picker,
.tag-input-row {
  margin-left: 36px;
}

.tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-chip {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 11px;
  cursor: pointer;
}

.tag-chip.selected {
  color: var(--accent-cyan);
  border-color: color-mix(in srgb, var(--accent-cyan) 45%, var(--border));
  background: color-mix(in srgb, var(--accent-cyan) 10%, var(--bg-solid));
}

.tag-empty-hint {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 11px;
}

.tag-input-row {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}

.tag-input-row input {
  min-width: 0;
  flex: 1;
  height: 28px;
  padding: 0 9px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 12px;
  outline: none;
}

.tag-input-row input:focus {
  border-color: var(--accent-cyan);
}

.tag-input-row button {
  height: 28px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--accent-cyan) 35%, var(--border));
  border-radius: 9px;
  background: var(--bg-solid);
  color: var(--accent-cyan);
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.date-time-row {
  margin: 8px 0 0 36px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 10px;
}

.date-time-row input {
  height: 24px;
  width: 86px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 11px;
}

.date-time-row input:disabled {
  opacity: 0.4;
}

.date-time-row small {
  color: var(--text-placeholder);
}

.calendar-box {
  margin: 7px 0 0 36px;
  padding: 8px 10px;
  border-radius: 7px;
  background: var(--bg-secondary);
}

.calendar-head {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calendar-head button {
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.calendar-head strong {
  color: var(--text-primary);
  font-size: 10px;
  font-weight: 600;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  text-align: center;
}

.calendar-week {
  padding: 2px 0;
  color: var(--text-secondary);
  font-size: 8px;
}

.calendar-day {
  padding: 3px 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 9px;
  cursor: pointer;
}

.calendar-day:hover { background: var(--bg-hover); }
.calendar-day.muted { color: var(--text-placeholder); }
.calendar-day.today { color: var(--primary); font-weight: 700; }
.calendar-day.selected { background: var(--primary); color: #fff; font-weight: 700; }

.sub-section,
.note-section {
  padding: 8px 0 6px;
  border-top: 1px solid var(--border-light);
}

.section-head {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.section-head span {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.sub-list {
  margin: 0;
  padding: 0 0 0 36px;
  display: grid;
  gap: 4px;
  list-style: none;
}

.sub-item {
  padding: 4px 7px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 5px;
  background: var(--bg-secondary);
}

.sub-circle {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  border: 1.5px solid var(--text-placeholder);
  border-radius: 50%;
}

.sub-input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 11px;
}

.sub-remove {
  border: 0;
  background: transparent;
  color: var(--text-placeholder);
  cursor: pointer;
}

.sub-add {
  margin-top: 4px;
  padding-left: 36px;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 10px;
  cursor: pointer;
}

.note-textarea {
  width: calc(100% - 36px);
  height: 34px;
  margin-left: 36px;
  padding: 6px 9px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 11px;
  line-height: 1.4;
  resize: vertical;
  outline: none;
}

.note-textarea:focus {
  border-color: var(--primary);
}

</style>
