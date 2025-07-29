<script setup>
import { useDataStore } from '@/stores/dataStore';
import FilterBar from '../../components/FilterBar.vue';
import { onMounted, ref } from 'vue';

const store = useDataStore();
const fileInput = ref(null);

// --- LOGIKA UPLOAD DIPINDAHKAN KE SINI ---
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
// --- AKHIR DARI LOGIKA UPLOAD ---

const exportToExcel = () => {
  alert('Export functionality will be implemented here');
};

// Ambil data untuk tabel saat komponen pertama kali dimuat
onMounted(() => {
  if (store.tableData.length === 0) {
    store.fetchDashboardData();
  }
});
</script>

<template>
  <main>
    <h1 class="page-title">Data Explorer</h1>
    
    <!-- BAGIAN UPLOAD SEKARANG ADA DI SINI -->
    <div class="upload-section card">
      <div class="upload-header">
        <h4>Update Data</h4>
        <button class="btn btn-secondary btn-sm" @click="refreshData" :disabled="store.isLoading || store.isUploading">
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
        <div v-if="store.isUploading" class="upload-status">
            <div class="loading-spinner-small"></div>
            <span>Processing file on server...</span>
        </div>
        <p v-else>Drag & Drop your Excel file here, or <span>click to select</span>.</p>
      </div>
    </div>

    <FilterBar :showItemsPerPage="true" />

    <div class="table-section">
      <div class="table-header">
        <h2 class="table-title">Revenue Data</h2>
        <button class="btn btn-primary" @click="exportToExcel">
          <span class="material-icons">file_download</span>
          Export to Excel
        </button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Regional</th>
            <th>Witel</th>
            <th>LCCD</th>
            <th>Stream</th>
            <th>Product Name</th>
            <th>GL Account</th>
            <th>BP Number</th>
            <th>Customer Name</th>
            <th>Customer Type</th>
            <th>Target</th>
            <th>Revenue</th>
            <th>Periode</th>
            <th>Target RKAPP</th>
          </tr>
        </thead>
        
        <tbody>
          <tr v-if="store.isLoading">
             <td colspan="13" style="text-align: center; padding: 20px;">Loading data...</td>
          </tr>
          <tr v-else-if="store.paginatedData.length === 0">
            <td colspan="13" style="text-align: center; padding: 20px;">
              No data found. Please upload a file or adjust your filters.
            </td>
          </tr>
          <tr v-else v-for="row in store.paginatedData" :key="row.id">
            <td>{{ row.regional }}</td>
            <td>{{ row.witel }}</td>
            <td>{{ row.lccd }}</td>
            <td>{{ row.stream }}</td>
            <td>{{ row.product_name }}</td>
            <td>{{ row.gl_account }}</td>
            <td>{{ row.bp_number }}</td>
            <td>{{ row.customer_name }}</td>
            <td>{{ row.customer_type }}</td>
            <td class="revenue-cell">Rp.{{ (row.target || 0).toLocaleString() }}</td>
            <td class="revenue-cell">Rp.{{ (row.revenue || 0).toLocaleString() }}</td>
            <td>{{ row.periode }}</td>
            <td class="revenue-cell">Rp.{{ (row.target_rkapp || 0).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination-controls">
        <button @click="store.currentPage--" :disabled="store.currentPage === 1">Previous</button>
        <span>Page {{ store.currentPage }} of {{ store.totalPages }}</span>
        <button @click="store.currentPage++" :disabled="store.currentPage === store.totalPages">Next</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.upload-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
}
.upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}
.upload-header h4 {
    margin: 0;
    font-weight: 600;
}
.upload-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--color-text-secondary);
}
.loading-spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0,0,0,0.1);
    border-radius: 50%;
    border-top-color: var(--color-primary);
    animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
