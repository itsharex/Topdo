<template>
  <div class="recurrence-panel" :class="{ 'recurrence-panel--embedded': embedded }">
    <button type="button" class="recurrence-header" @click="toggleEnabled">
      <span v-if="!embedded" class="recurrence-title">重复</span>
      <span v-else class="recurrence-summary">{{ enabled ? recurrenceSummary : '关闭' }}</span>
      <span class="switch" :class="{ on: enabled }"><i /></span>
    </button>

    <Transition name="recurrence-expand">
      <div v-if="enabled" class="recurrence-body">
        <div class="recurrence-section-title">频率</div>
        <ChipSelector
          :model-value="draft.type"
          :options="freqOptions"
          tone="purple"
          compact
          @update:model-value="onTypeUpdate"
        />

        <div v-if="draft.type === 'weekly' || draft.type === 'custom'" class="weekday-row">
          <button
            v-for="day in weekdays"
            :key="day.value"
            type="button"
            :class="{ selected: draft.daysOfWeek?.includes(day.value) }"
            @click="toggleDay(day.value)"
          >
            {{ day.label }}
          </button>
        </div>

        <label v-if="draft.type === 'monthly'" class="compact-field">
          <span>每月</span>
          <select v-model.number="draft.dayOfMonth" @change="emitDraft">
            <option v-for="day in 31" :key="day" :value="day">{{ day }}号</option>
          </select>
        </label>

        <div class="end-block">
          <span>结束</span>
          <ChipSelector
            :model-value="endType"
            :options="endOptions"
            tone="purple"
            compact
            @update:model-value="onEndUpdate"
          />
          <input v-if="endType === 'date'" v-model="draft.endDate" class="mini-input" type="date" @change="emitDraft" />
          <input v-if="endType === 'count'" v-model.number="draft.endCount" class="mini-input" type="number" min="1" placeholder="次数" @change="emitDraft" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { RecurrenceRule } from '../types';
import { parseRecurrenceRule } from '../utils/recurrence';
import ChipSelector, { type ChipOption } from './ui/ChipSelector.vue';

const props = withDefaults(defineProps<{ modelValue: RecurrenceRule | null; embedded?: boolean }>(), {
  embedded: false
});
const emit = defineEmits<{ (event: 'update:modelValue', value: RecurrenceRule | null): void }>();

function todayWeekday() {
  return new Date().getDay();
}

function todayMonthDay() {
  return new Date().getDate();
}

function defaultRule(): RecurrenceRule {
  return {
    type: 'weekly',
    interval: 1,
    daysOfWeek: [todayWeekday()],
    dayOfMonth: todayMonthDay(),
    endDate: null,
    endCount: null
  };
}

const enabled = ref(false);
const draft = reactive<RecurrenceRule>(defaultRule());
const endType = computed(() => draft.endDate ? 'date' : draft.endCount ? 'count' : 'never');
const freqOptions: ChipOption[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekdays', label: '工作日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'custom', label: '自定义' }
];
const endOptions: ChipOption[] = [
  { value: 'never', label: '永不' },
  { value: 'date', label: '指定日期' },
  { value: 'count', label: '重复N次' }
];
const weekdays = ['日', '一', '二', '三', '四', '五', '六'].map((label, value) => ({ label, value }));
const recurrenceSummary = computed(() => {
  const option = freqOptions.find((item) => item.value === draft.type);
  if (draft.type === 'weekly' || draft.type === 'custom') {
    const labels = normalizeWeekdays(draft.daysOfWeek).map((day) => weekdays[day]?.label).filter(Boolean).join('、');
    return `${option?.label || '重复'} · ${labels}`;
  }
  return option?.label || '已开启';
});

function normalizeDayOfMonth(value: unknown) {
  const day = Number(value || todayMonthDay());
  if (!Number.isFinite(day)) return todayMonthDay();
  return Math.min(31, Math.max(1, Math.round(day)));
}

function normalizeEndCount(value: unknown) {
  const count = Number(value || 0);
  if (!Number.isFinite(count) || count < 1) return null;
  return Math.round(count);
}

function normalizeWeekdays(value: unknown) {
  const selected = Array.isArray(value)
    ? value.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : [];
  return selected.length ? Array.from(new Set(selected)).sort() : [todayWeekday()];
}

function normalizedDraft(): RecurrenceRule {
  const usesWeekdays = draft.type === 'weekly' || draft.type === 'custom';
  return {
    type: draft.type,
    interval: Math.max(1, Number(draft.interval || 1)),
    daysOfWeek: usesWeekdays ? normalizeWeekdays(draft.daysOfWeek) : undefined,
    dayOfMonth: draft.type === 'monthly' ? normalizeDayOfMonth(draft.dayOfMonth) : undefined,
    endDate: draft.endDate || null,
    endCount: draft.endCount ? normalizeEndCount(draft.endCount) : null
  };
}

function applyExternalValue(value: RecurrenceRule | null) {
  const parsed = parseRecurrenceRule(value);
  if (!parsed) {
    enabled.value = false;
    Object.assign(draft, defaultRule());
    return;
  }

  enabled.value = true;
  Object.assign(draft, defaultRule(), parsed, {
    daysOfWeek: normalizeWeekdays(parsed.daysOfWeek),
    dayOfMonth: normalizeDayOfMonth(parsed.dayOfMonth),
    endCount: parsed.endCount ? normalizeEndCount(parsed.endCount) : null,
    endDate: parsed.endDate || null
  });
}

function emitDraft() {
  if (!enabled.value) return;
  const normalized = normalizedDraft();
  Object.assign(draft, normalized);
  emit('update:modelValue', normalized);
}

function toggleEnabled() {
  enabled.value = !enabled.value;
  emit('update:modelValue', enabled.value ? normalizedDraft() : null);
}

function setType(type: RecurrenceRule['type']) {
  draft.type = type;
  if (type === 'weekly' || type === 'custom') {
    draft.daysOfWeek = normalizeWeekdays(draft.daysOfWeek);
  }
  if (type === 'monthly') {
    draft.dayOfMonth = normalizeDayOfMonth(draft.dayOfMonth);
  }
  emitDraft();
}

function onTypeUpdate(value: string | number | null) {
  if (typeof value === 'string') setType(value as RecurrenceRule['type']);
}

function toggleDay(day: number) {
  const selected = new Set(normalizeWeekdays(draft.daysOfWeek));
  if (selected.has(day)) {
    if (selected.size === 1) return;
    selected.delete(day);
  } else {
    selected.add(day);
  }
  draft.daysOfWeek = Array.from(selected).sort();
  emitDraft();
}

function setEnd(type: 'never' | 'date' | 'count') {
  draft.endDate = type === 'date' ? (draft.endDate || new Date().toISOString().slice(0, 10)) : null;
  draft.endCount = type === 'count' ? (normalizeEndCount(draft.endCount) || 7) : null;
  emitDraft();
}

function onEndUpdate(value: string | number | null) {
  if (value === 'never' || value === 'date' || value === 'count') setEnd(value);
}

watch(
  () => props.modelValue,
  (value) => applyExternalValue(value),
  { immediate: true }
);
</script>

<style scoped>
.recurrence-panel {
  display: grid;
  gap: 8px;
  width: 100%;
}

.recurrence-header {
  width: 100%;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.recurrence-summary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
  font-weight: 500;
}

.switch {
  width: 42px;
  height: 26px;
  padding: 2px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--bg-tertiary);
  transition: background 0.15s ease;
}

.switch i {
  display: block;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg-solid);
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s ease;
}

.switch.on {
  background: var(--accent-blue);
}

.switch.on i {
  transform: translateX(16px);
}

.recurrence-body {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
}

.recurrence-section-title,
.end-block > span {
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
}

.weekday-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.weekday-row button {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-solid);
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.weekday-row button:hover {
  border-color: var(--accent-purple);
}

.weekday-row button.selected {
  color: #fff;
  border-color: var(--accent-purple);
  background: var(--accent-purple);
}

.compact-field {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.compact-field select,
.mini-input {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  background: var(--bg-solid);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 12px;
  outline: none;
}

.end-block {
  display: grid;
  gap: 8px;
}

.recurrence-expand-enter-active,
.recurrence-expand-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.recurrence-expand-enter-from,
.recurrence-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
