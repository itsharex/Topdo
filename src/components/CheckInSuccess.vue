<template>
  <Transition name="checkin-success">
    <div v-if="visible" class="success-toast">
      <div class="success-emoji">🎉</div>
      <div class="success-text">连续第 {{ streak }} 天！</div>
      <div v-if="nextMilestone" class="milestone">🏆 距离 {{ nextMilestone }} 天还差 {{ nextMilestone - streak }} 天</div>
    </div>
  </Transition>
</template>
<script setup lang="ts">
defineProps<{ visible: boolean; streak: number; nextMilestone: number | null }>();
</script>
<style scoped>
.success-toast { position: absolute; left: 50%; top: 92px; z-index: 70; transform: translateX(-50%); min-width: 190px; padding: 14px 16px; border-radius: 16px; background: var(--bg-solid); box-shadow: 0 16px 40px rgba(0,0,0,.16); text-align: center; border: 1px solid var(--border); }
.success-emoji { font-size: 28px; }
.success-text { margin-top: 4px; font-weight: 700; color: var(--text-primary); }
.milestone { margin-top: 4px; color: var(--text-secondary); font-size: 11px; }
.checkin-success-enter-active, .checkin-success-leave-active { transition: opacity .2s ease, transform .2s ease; }
.checkin-success-enter-from, .checkin-success-leave-to { opacity: 0; transform: translateX(-50%) scale(.92); }
</style>
