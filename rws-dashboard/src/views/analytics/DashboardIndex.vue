<script setup>
import { useDataStore } from '@/stores/dataStore';
import { ref, onMounted } from 'vue';
import RevenueBarChart from '../../components/RevenueBarChart.vue';
import StatusPieChart from '../../components/StatusPieChart.vue';
import RevenueLineChart from '../../components/RevenueLineChart.vue';
import FilterBar from '../../components/FilterBar.vue';

const store = useDataStore();
const fileInput = ref(null);

const handleFileSelect = (event) => {
  store.uploadAnalyticsFile(event.target.files[0]);
};

const handleDrop = (event) => {
  store.setDragging(false);
  store.uploadAnalyticsFile(event.dataTransfer.files[0]);
};

const handleDragOver = () => store.setDragging(true);
const handleDragLeave = () => store.setDragging(false);

const refreshData = () => {
  store.fetchDashboardData();
  if (fileInput.value) {
    fileInput.value.value = null;
  }
};

onMounted(() => {
  if (store.tableData.length === 0) {
    store.fetchDashboardData();
  }
});
</script>

<template>
  <main>
    <h1 class="page-title">Wholesale Dashboard</h1>

    <div class="upload-section">
      <div class="refresh-upload">
        <button class="btn btn-primary" @click="refreshData" :disabled="store.isLoading || store.isUploading">
          <span class="material-icons">refresh</span>
          Refresh Data
        </button>
      </div>
      <div class="upload-zone" 
           :class="{ 'is-dragging': store.isDragging }" 
           @dragover.prevent="handleDragOver" 
           @dragleave.prevent="handleDragLeave" 
           @drop.prevent="handleDrop">
        <input
          type="file"
          id="file-upload"
          ref="fileInput"
          accept=".xlsx, .xls"
          @change="handleFileSelect"
          :disabled="store.isUploading"
        />
        <p v-if="!store.isUploading">Drag & Drop your Excel file here, or <span>click to select</span>.</p>
        <p v-else>Uploading and processing file...</p>
      </div>
    </div>

    <FilterBar :showItemsPerPage="false" />
    
    <div class="summary-cards">
      <div class="card">
        <h2>Total Revenue</h2>
        <p>Rp.{{ (store.summaryCards.totalRevenue || 0).toLocaleString() }}</p>
      </div>
    </div>

    <div v-if="store.isLoading || store.isUploading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ store.isUploading ? 'Processing your file on the server...' : 'Loading dashboard data...' }}</p>
    </div>

    <div v-else-if="!store.tableData.length" class="empty-state">
      <span class="material-icons">upload_file</span>
      <p>No data available. Please upload an Excel file.</p>
    </div>

    <template v-else>
      <div class="chart-container line-chart">
        <h3>Revenue Trends by Period</h3>
        <RevenueLineChart :chart-data="store.revenueLineChartData" />
      </div>
      <div class="charts-wrapper">
        <div class="chart-container">
          <h3>Revenue by Customer</h3>
          <RevenueBarChart :chart-data="store.revenueChartData" />
        </div>
        <div class="chart-container">
          <h3>Order Status Breakdown</h3>
          <StatusPieChart :chart-data="store.pieChartData" />
        </div>
      </div>
    </template>
  </main>
</template>
