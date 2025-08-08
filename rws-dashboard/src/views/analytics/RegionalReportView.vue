<script setup>
import { ref, onMounted, watch } from 'vue';

// State untuk menampung data laporan dan filter
const reportData = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Fungsi untuk mendapatkan periode bulan ini dalam format YYYY-MM untuk input
const getCurrentMonthForInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

const selectedMonthInput = ref(getCurrentMonthForInput());

// Fungsi untuk memanggil API backend
async function fetchReport() {
  isLoading.value = true;
  error.value = null;
  reportData.value = [];
  try {
    const periodeForAPI = selectedMonthInput.value.replace('-', '');
    
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiBaseUrl}/api/reports/regional?periode=${periodeForAPI}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil data laporan dari server.');
    }
    const data = await response.json();
    
    // Hitung baris TOTAL di frontend
    const total = {
      regional: 'TOTAL',
      tgt_mtd: data.reduce((sum, item) => sum + parseFloat(item.tgt_mtd), 0),
      real_mtd: data.reduce((sum, item) => sum + parseFloat(item.real_mtd), 0),
      tgt_ytd: data.reduce((sum, item) => sum + parseFloat(item.tgt_ytd), 0),
      real_ytd: data.reduce((sum, item) => sum + parseFloat(item.real_ytd), 0),
    };
    total.ach_mtd = total.tgt_mtd ? (total.real_mtd / total.tgt_mtd) * 100 : 0;
    total.ach_ytd = total.tgt_ytd ? (total.real_ytd / total.tgt_ytd) * 100 : 0;

    reportData.value = [...data, total];

  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

// Panggil fungsi saat komponen pertama kali dimuat
onMounted(fetchReport);

// (Opsional) Buat filter reaktif tanpa tombol search
watch(selectedMonthInput, () => {
  fetchReport();
});
</script>

<template>
  <main>
    <h1 class="page-title">Revenue Performance - Per Regional (OGD)</h1>

    <!-- Filter Section -->
    <div class="card filter-section">
      <div class="filter-control">
        <label for="periode-picker">PERIODE</label>
        <input type="month" id="periode-picker" v-model="selectedMonthInput">
      </div>
      <!-- Tombol Search bisa dihapus jika Anda menggunakan 'watch' -->
    </div>

    <!-- Loading & Error States -->
    <div v-if="isLoading" class="loading-state card"><p>Memuat laporan...</p></div>
    <div v-else-if="error" class="error-state card"><p>{{ error }}</p></div>

    <!-- Report Table -->
    <div v-else-if="reportData.length > 0" class="card report-table-card">
      <div class="report-header">
        <h3>REPORT REVENUE - PER REGIONAL (PERIODE: {{ selectedMonthInput }})</h3>
        <div class="action-buttons">
          <button class="btn btn-sm btn-secondary">Excel</button>
          <button class="btn btn-sm btn-secondary">Copy</button>
          <button class="btn btn-sm btn-secondary">JPEG</button>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th rowspan="2">REGIONAL</th>
            <th :colspan="4">MTD {{ selectedMonthInput }}</th>
            <th :colspan="4">YTD {{ selectedMonthInput }}</th>
          </tr>
          <tr>
            <th>TGT</th>
            <th>REAL</th>
            <th>ACH</th>
            <th>RANK</th>
            <th>TGT</th>
            <th>REAL</th>
            <th>ACH</th>
            <th>RANK</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in reportData" :key="index" :class="{ 'total-row': row.regional === 'TOTAL' }">
            <td>{{ row.regional }}</td>
            <td>{{ parseFloat(row.tgt_mtd).toLocaleString('id-ID') }}</td>
            <td>{{ parseFloat(row.real_mtd).toLocaleString('id-ID') }}</td>
            <td>{{ parseFloat(row.ach_mtd).toFixed(2) }}%</td>
            <td>{{ row.rank_mtd || '-' }}</td>
            <td>{{ parseFloat(row.tgt_ytd).toLocaleString('id-ID') }}</td>
            <td>{{ parseFloat(row.real_ytd).toLocaleString('id-ID') }}</td>
            <td>{{ parseFloat(row.ach_ytd).toFixed(2) }}%</td>
            <td>{{ row.rank_ytd || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.filter-section {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  max-width: 300px; /* Batasi lebar filter */
}
.filter-control {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.filter-control label {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--color-text-secondary);
}
.filter-control input[type="month"] {
  padding: 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-family: var(--font-family);
}
.report-table-card { overflow-x: auto; }
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.report-header h3 { font-size: 1.1rem; font-weight: 600; }
.action-buttons { display: flex; gap: 0.5rem; }
table { width: 100%; border-collapse: collapse; white-space: nowrap; }
th, td { border: 1px solid var(--color-border); padding: 0.75rem; text-align: right; }
th { background-color: var(--color-secondary); color: white; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
thead tr:first-child th { background-color: #2c3e50; }
thead tr:last-child th { background-color: #34495e; }
td:first-child, th:first-child { text-align: left; font-weight: 500; position: sticky; left: 0; background-color: var(--color-background-card); }
thead th:first-child { background-color: #2c3e50; }
.total-row { font-weight: 700; background-color: var(--color-background); }
.total-row td:first-child { background-color: var(--color-background); }
.loading-state, .error-state { text-align: center; padding: 2rem; }
</style>
