<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  icon: {
    type: String,
    default: 'bar_chart',
  },
  format: {
    type: String,
    default: 'number',
  },
});

const formatValue = (val, format) => {
  if (typeof val !== 'number') return val;
  if (format === 'percent') {
    return `${val.toFixed(2)}%`;
  }
  if (format === 'integer') {
      return val.toLocaleString('id-ID');
  }
  return `Rp. ${val.toLocaleString('id-ID')}`;
};
</script>

<template>
  <div class="card kpi-card">
    <div class="icon-wrapper">
      <span class="material-icons">{{ icon }}</span>
    </div>
    <div class="text-wrapper">
      <h2>{{ title }}</h2>
      <p>{{ formatValue(value, format) }}</p>
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 250px;
}
.icon-wrapper {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-wrapper .material-icons {
  font-size: 2rem;
}
.text-wrapper h2 {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
  white-space: nowrap;
}
.text-wrapper p {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}
</style>
