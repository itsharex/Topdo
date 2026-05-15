<template>
  <div class="modal-mask" @click.self="emit('close')">
    <form class="modal-card" @submit.prevent="submit">
      <h3>{{ habit ? '编辑习惯' : '创建习惯' }}</h3>
      <div class="habit-basic">
        <input v-model="draft.emoji" class="emoji-input" maxlength="4" />
        <input v-model.trim="draft.name" class="text-input" placeholder="习惯名称，例如 阅读" />
      </div>
      <div class="color-row">
        <button v-for="color in colors" :key="color" type="button" class="color-dot" :class="{ active: draft.color === color }" :style="{ background: color }" @click="draft.color = color"></button>
      </div>
      <div class="chip-group">
        <button type="button" class="chip" :class="{ active: draft.frequency_type === 'daily' }" @click="draft.frequency_type = 'daily'">每天</button>
        <button type="button" class="chip" :class="{ active: draft.frequency_type === 'weekdays' }" @click="draft.frequency_type = 'weekdays'">工作日</button>
        <button type="button" class="chip" :class="{ active: draft.frequency_type === 'custom' }" @click="draft.frequency_type = 'custom'">自定义</button>
      </div>
      <div v-if="draft.frequency_type === 'custom'" class="weekday-row">
        <button v-for="day in weekdays" :key="day.value" type="button" :class="{ selected: draft.frequency_days.includes(day.value) }" @click="toggleDay(day.value)">{{ day.label }}</button>
      </div>
      <div class="form-grid">
        <label><span>提醒时间</span><input v-model="draft.remind_time" type="time" /></label>
        <label><span>目标天数</span><input v-model.number="draft.target_days" type="number" min="1" placeholder="可选" /></label>
      </div>
      <div class="actions">
        <button type="button" class="ghost" @click="emit('close')">取消</button>
        <button type="submit" class="primary" :disabled="!draft.name.trim()">保存</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { Habit } from '../types/habit';

const props = defineProps<{ habit?: Habit | null }>();
const emit = defineEmits<{ (event: 'close'): void; (event: 'save', value: Partial<Habit>): void }>();
const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
const weekdays = ['日', '一', '二', '三', '四', '五', '六'].map((label, value) => ({ label, value }));
const draft = reactive({
  name: props.habit?.name || '',
  emoji: props.habit?.emoji || '🎯',
  color: props.habit?.color || '#10b981',
  frequency_type: props.habit?.frequency_type || 'daily' as Habit['frequency_type'],
  frequency_days: [...(props.habit?.frequency_days || [1, 2, 3, 4, 5])],
  remind_time: props.habit?.remind_time || '',
  target_days: props.habit?.target_days || null as number | null
});
function toggleDay(day: number) { const set = new Set(draft.frequency_days); set.has(day) ? set.delete(day) : set.add(day); draft.frequency_days = Array.from(set).sort(); }
function submit() { emit('save', { ...draft }); emit('close'); }
</script>

<style scoped>
.modal-mask { position: absolute; inset: 0; z-index: 90; display: grid; place-items: center; background: rgba(0,0,0,.22); }
.modal-card { width: min(292px, calc(100% - 28px)); padding: 16px; border-radius: 16px; background: var(--bg-solid); border: 1px solid var(--border); box-shadow: 0 18px 50px rgba(0,0,0,.2); }
h3 { margin: 0 0 12px; color: var(--text-primary); font-size: 16px; }
.habit-basic { display: grid; grid-template-columns: 46px 1fr; gap: 8px; }
.emoji-input, .text-input, .form-grid input { height: 36px; border: 1px solid var(--border); border-radius: var(--radius-btn); background: var(--bg-secondary); color: var(--text-primary); padding: 0 10px; outline: none; }
.emoji-input { text-align: center; font-size: 20px; padding: 0; }
.color-row, .chip-group, .weekday-row, .actions { margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
.color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.color-dot.active { border-color: var(--text-primary); }
.chip, .weekday-row button { padding: 5px 9px; border: 1px solid var(--border); border-radius: 999px; background: var(--bg-secondary); color: var(--text-secondary); cursor: pointer; }
.chip.active, .weekday-row button.selected { color: #059669; border-color: #10b981; background: color-mix(in srgb, #10b981 12%, var(--bg-solid)); }
.form-grid { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.form-grid label { display: grid; gap: 4px; font-size: 11px; color: var(--text-secondary); }
.actions { justify-content: flex-end; }
.ghost, .primary { height: 30px; padding: 0 12px; border-radius: var(--radius-btn); cursor: pointer; }
.ghost { border: 0; background: transparent; color: var(--text-secondary); }
.primary { border: 0; background: var(--primary); color: #fff; }
.primary:disabled { opacity: .5; cursor: not-allowed; }
</style>
