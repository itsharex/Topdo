<template>
  <span class="shortcut-input" aria-label="快捷键">
    <span v-for="(key, index) in normalizedKeys" :key="`${key}-${index}`" class="kbd">{{ key }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value?: string;
  keys?: string[];
}>();

const normalizedKeys = computed(() => {
  if (props.keys?.length) return props.keys;
  const raw = props.value?.trim();
  if (!raw) return ['未设置'];
  return raw
    .replace(/Command/gi, 'Cmd')
    .replace(/Option/gi, 'Alt')
    .replace(/Control/gi, 'Ctrl')
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (/^(cmd|command|meta)$/i.test(part)) return '⌘';
      if (/^(shift)$/i.test(part)) return '⇧';
      if (/^(alt|option)$/i.test(part)) return '⌥';
      if (/^(ctrl|control)$/i.test(part)) return '⌃';
      return part.length === 1 ? part.toUpperCase() : part;
    });
});
</script>

<style scoped>
.shortcut-input {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  background: var(--bg-secondary);
}

.kbd {
  min-width: 18px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-tag);
  background: var(--bg-solid);
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1;
  box-shadow: 0 1px 0 var(--border);
}
</style>
