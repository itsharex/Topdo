<template>
  <div class="reminder-section" :class="{ 'reminder-section--embedded': embedded }">
    <div v-if="!embedded" class="section-header">提醒</div>
    <ChipSelector :model-value="modelValue" :options="options" tone="amber" compact @update:model-value="onReminderUpdate" />
  </div>
</template>

<script setup lang="ts">
import ChipSelector, { type ChipOption } from './ui/ChipSelector.vue';

withDefaults(defineProps<{ modelValue: number | null; embedded?: boolean }>(), {
  embedded: false
});
const emit = defineEmits<{ (event: 'update:modelValue', value: number | null): void }>();
const options: ChipOption[] = [
  { label: '不提醒', value: null },
  { label: '到期时', value: 0 },
  { label: '提前15分钟', value: 15 },
  { label: '提前1小时', value: 60 },
  { label: '提前1天', value: 1440 }
];

function onReminderUpdate(value: string | number | null) {
  emit('update:modelValue', typeof value === 'number' ? value : null);
}
</script>

<style scoped>
.reminder-section {
  display: grid;
  gap: 8px;
  width: 100%;
}

.section-header {
  font-size: 12px;
  font-weight: 650;
  color: var(--text-secondary);
}
</style>
