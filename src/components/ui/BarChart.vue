<template>
  <section class="bar-chart-card">
    <div class="bar-chart-card__header">
      <h3>{{ title }}</h3>
      <span v-if="summary">{{ summary }}</span>
    </div>
    <div class="bar-chart" :style="{ '--chart-height': `${height}px` }">
      <div v-for="item in data" :key="item.label" class="bar-chart__item">
        <span class="bar-chart__value">{{ item.value }}</span>
        <div class="bar-chart__track" aria-hidden="true">
          <div class="bar-chart__bar" :class="{ today: item.isToday }" :style="{ height: `${barHeight(item.value)}px` }"></div>
        </div>
        <span class="bar-chart__label" :class="{ today: item.isToday }">{{ item.label }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  title: string;
  summary?: string;
  data: Array<{ label: string; value: number; isToday?: boolean }>;
  height?: number;
}>(), {
  summary: '',
  height: 96
});

const maxValue = computed(() => Math.max(1, ...props.data.map((item) => item.value)));

function barHeight(value: number): number {
  if (value <= 0) return 4;
  return Math.max(8, Math.round((value / maxValue.value) * props.height));
}
</script>

<style scoped>
.bar-chart-card {
  padding: 14px 12px 12px;
  border: 1px solid var(--border-light);
  border-radius: 14px;
  background: var(--bg-solid);
}

.bar-chart-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.bar-chart-card__header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  color: var(--text-primary);
}

.bar-chart-card__header span {
  font-size: 12px;
  color: var(--text-secondary);
}

.bar-chart {
  height: calc(var(--chart-height) + 38px);
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 7px;
  align-items: end;
}

.bar-chart__item {
  min-width: 0;
  display: grid;
  justify-items: center;
  grid-template-rows: 16px var(--chart-height) 14px;
  gap: 4px;
}

.bar-chart__value {
  font-size: 11px;
  font-weight: 650;
  color: var(--text-secondary);
}

.bar-chart__track {
  height: var(--chart-height);
  display: flex;
  align-items: end;
}

.bar-chart__bar {
  width: 22px;
  border-radius: 7px 7px 3px 3px;
  background: var(--chart-bar);
  transition: height 0.2s ease;
}

.bar-chart__bar.today {
  background: linear-gradient(180deg, var(--accent-blue-light), var(--accent-blue));
}

.bar-chart__label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.bar-chart__label.today {
  color: var(--accent-blue);
  font-weight: 650;
}
</style>
