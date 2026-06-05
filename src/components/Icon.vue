<template>
  <svg
    class="topdo-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="iconMarkup"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}>(), {
  size: 20,
  color: 'currentColor',
  strokeWidth: 1.5
});

const icons: Record<string, string> = {
  task: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.2l2.2 2.2 4.8-5"/>',
  recurring: '<path d="M17 3l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 21l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8.5-3 8.5h18S18 15 18 8"/><path d="M14 20a2.3 2.3 0 0 1-4 0"/><path d="M4.5 4.5l-1.2 1.2"/><path d="M19.5 4.5l1.2 1.2"/>',
  flame: '<path d="M12 22c-3.8-1.6-6.5-4.6-6.5-8.4 0-2.7 1.6-4.8 3.9-6.1.2 2.2 1.1 3.8 2.7 4.7 1.8-2.7 2.7-5.7 2.4-9.2 2.8 2.4 4 5.4 4 8.5 0 4.3-2.6 8-6.5 10.5z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M4 10h16"/><circle cx="12" cy="15" r="1.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  'file-text': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h6"/>',
  list: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  priority: '<circle cx="12" cy="12" r="9"/><path d="M12 16V8"/><path d="M8.8 11.2L12 8l3.2 3.2"/>',
  edit: '<path d="M4 20h4.5L19 9.5a2.8 2.8 0 0 0-4-4L4.5 16 4 20z"/><path d="M13.5 7L17 10.5"/>',
  add: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  stats: '<path d="M4 19h16"/><rect x="6" y="11" width="3" height="6" rx="1"/><rect x="11" y="7" width="3" height="10" rx="1"/><rect x="16" y="4" width="3" height="13" rx="1"/>',
  moon: '<path d="M20.5 14.2A8.4 8.4 0 0 1 9.8 3.5 8.6 8.6 0 1 0 20.5 14.2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2"/><path d="M12 19.5v2"/><path d="M4.6 4.6L6 6"/><path d="M18 18l1.4 1.4"/><path d="M2.5 12h2"/><path d="M19.5 12h2"/><path d="M4.6 19.4L6 18"/><path d="M18 6l1.4-1.4"/>',
  monitor: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  'cloud-sync': '<path d="M17.8 18H8a5 5 0 1 1 1.1-9.9A6.5 6.5 0 0 1 21 12.5"/><path d="M17 14h4v4"/><path d="M21 14l-4.5 4.5"/>',
  'cloud-off': '<path d="M3 3l18 18"/><path d="M8.4 8.4A5 5 0 0 0 8 18h8.6"/><path d="M17.8 18A4 4 0 0 0 21 13.5a4.2 4.2 0 0 0-4.5-3.9A6.5 6.5 0 0 0 7.2 6.8"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.2 7.2 0 0 0-1.9-1.1L14.3 3h-4.6l-.4 2.9A7.2 7.2 0 0 0 7.5 7l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1c.6.5 1.2.8 1.9 1.1l.4 2.9h4.6l.4-2.9c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.4-2-1.5c0-.3.1-.7.1-1.1z"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 10h.01"/><path d="M11 10h.01"/><path d="M15 10h.01"/><path d="M17 14h.01"/><path d="M7 14h6"/>',
  rocket: '<path d="M13.5 4.5C16 2 19 2 21 3c1 2 1 5-1.5 7.5L13 17l-6-6 6.5-6.5z"/><path d="M9 15l-3 3"/><path d="M6.5 12.5L4 13l1-3 2.2-2.2"/><path d="M11.5 17.5L11 20l3-1 2.2-2.2"/><circle cx="16.5" cy="7.5" r="1.5"/>',
  github: '<path d="M12 2.8a9.2 9.2 0 0 0-2.9 17.9c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.4 9.4 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.6 4.9.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A9.2 9.2 0 0 0 12 2.8z"/>',
  chat: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v6A3.5 3.5 0 0 1 16.5 15H10l-5 4v-4.5A3.5 3.5 0 0 1 4 12V5.5z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  key: '<circle cx="7.5" cy="14.5" r="3.5"/><path d="M10 12l8-8"/><path d="M15 7l2 2"/><path d="M17 5l2 2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1.4l2.2-2.2a5 5 0 0 0-7.1-7.1L11 5.3"/><path d="M14 11a5 5 0 0 0-7.1-.4l-2.2 2.2a5 5 0 0 0 7.1 7.1L13 18.7"/>',
  tag: '<path d="M20 12.5 12.5 20a2.2 2.2 0 0 1-3.1 0L4 14.6V4h10.6L20 9.4a2.2 2.2 0 0 1 0 3.1z"/><circle cx="8.5" cy="8.5" r="1.2"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.2 2.2 4.8-5"/>',
  update: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/><path d="M12 16V8"/><path d="M9 11l3-3 3 3"/>',
  pin: '<path d="M14 3l7 7-3 1-4 4v4l-2 2-3.5-3.5L5 21l-2-2 6-6-3.5-3.5 2-2h4l4-4 1-3z"/>',
  cat: '<path d="M6 8V4l3 2h6l3-2v4a7 7 0 1 1-12 0z"/><path d="M9 13h.01"/><path d="M15 13h.01"/><path d="M11 16h2"/>',
  'habit-mode': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/>',
  folder: '<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2.5h6A2.5 2.5 0 0 1 20.5 10v6.5A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9z"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
  'more-horizontal': '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M16 16l4 4"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'
};

const iconMarkup = computed(() => icons[props.name] || icons.info);
</script>

<style scoped>
.topdo-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
