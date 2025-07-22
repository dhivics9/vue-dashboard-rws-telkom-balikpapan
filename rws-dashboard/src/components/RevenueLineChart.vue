<script setup>
import { Line } from 'vue-chartjs';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  LinearScale, 
  PointElement, 
  CategoryScale,
  Filler 
} from 'chart.js';
import { computed } from 'vue';

ChartJS.register(
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  LinearScale, 
  PointElement, 
  CategoryScale,
  Filler 
);

// This component expects a 'chartData' prop to be passed to it
const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({
      labels: [],
      datasets: [{ 
        label: 'Total Revenue',
        backgroundColor: 'rgba(65, 184, 131, 0.2)',
        borderColor: '#41B883',
        data: [],
        fill: true
      }]
    })
  }
});


const safeChartData = computed(() => {
  return props.chartData || {
    labels: [],
    datasets: [{ 
      label: 'Total Revenue',
      backgroundColor: 'rgba(65, 184, 131, 0.2)',
      borderColor: '#41B883',
      data: [],
      fill: true
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      left: 10,
      right: 10,
      top: 20,
      bottom: 20
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        font: {
          family: 'Poppins',
          size: 12
        },
        padding: 15
      }
    },
    title: {
      display: false,
      text: 'Revenue Trends',
      font: {
        family: 'Poppins',
        size: 16,
        weight: 600
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          const value = context.parsed.y;
          return label + 'Rp.' + value.toLocaleString();
        }
      }
    }
  },
  scales: {
    x: {
      ticks: {
        font: {
          family: 'Poppins',
          size: 11
        },
        maxRotation: 45,
        minRotation: 45,
        padding: 8 
      },
      grid: {
        display: true,
        drawOnChartArea: true,
        drawTicks: true,
        color: 'rgba(0, 0, 0, 0.05)' 
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        font: {
          family: 'Poppins',
          size: 11
        },
        padding: 8,
        callback: function(value) {
          if (value >= 1000000) {
            return 'Rp.' + (value / 1000000).toLocaleString() + 'M';
          } else if (value >= 1000) {
            return 'Rp.' + (value / 1000).toLocaleString() + 'K';
          }
          return 'Rp.' + value.toLocaleString();
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    }
  },
  elements: {
    line: {
      tension: 0.3
    },
    point: {
      radius: 4,
      hitRadius: 10,
      hoverRadius: 6
    }
  }
};
</script>

<template>
  <div class="chart-wrapper">
    <Line :data="safeChartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  padding: 5px;
}
</style>