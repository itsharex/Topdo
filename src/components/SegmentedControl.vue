<template>
  <div class="segmented-control" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segmented-option"
      :class="{ active: option.value === modelValue }"
      role="tab"
      :aria-selected="option.value === modelValue"
      @click="$emit('update:modelValue', option.value)"
    >
      <Icon v-if="option.icon" :name="option.icon" :size="16" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';

defineProps<{
  modelValue: string;
  options: Array<{ value: string; label: string; icon?: string }>;
}>();

defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();
</script>

<style scoped>
.segmented-control {
  display: flex;
  gap: 2px;
  border-radius: var(--radius-card);
  background: var(--seg-bg);
  padding: 2px;
}

.segmented-option {
  min-height: 32px;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: calc(var(--radius-card) - 2px);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.segmented-option:hover {
  color: var(--text-primary);
}

.segmented-option.active {
  background: var(--seg-active-bg);
  color: var(--text-primary);
  box-shadow: var(--seg-active-shadow);
}
</style>
