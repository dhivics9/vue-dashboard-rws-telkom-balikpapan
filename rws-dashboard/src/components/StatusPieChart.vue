<script setup>
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';
import { computed } from 'vue';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({
      labels: ['New', 'Modify', 'Cancel'],
      datasets: [{ 
        backgroundColor: ['#41B883', '#E46651', '#00D8FF'],
        data: [0, 0, 0]
      }]
    })
  }
});

const safeChartData = computed(() => {
  return props.chartData || {
    labels: ['New', 'Modify', 'Cancel'],
    datasets: [{ 
      backgroundColor: ['#41B883', '#E46651', '#00D8FF'],
      data: [0, 0, 0]
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  layout: {
    padding: {
      top: 20,
      bottom: 20
    }
  },
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: {
          family: 'Poppins',
          size: 12
        },
        boxWidth: 15,
        padding: 15
      }
    },
    title: {
      display: false,
      text: 'Order Status Breakdown',
      font: {
        family: 'Poppins',
        size: 16,
        weight: 600
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.formattedValue;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((context.raw / total) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  }
};
</script>

<template>
  <div class="chart-wrapper">
    <Pie :data="safeChartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  padding: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>